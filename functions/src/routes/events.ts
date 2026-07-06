import {Router} from "express";
import {z, ZodError} from "zod";
import {AuthenticatedRequest, currentUser} from "../auth";
import {
  canClaimSlot,
  canManageEvents,
  getActiveClaimForSlot,
} from "../domain";
import {joinEvent, joinEvents} from "../eventMapper";
import {SheetsService} from "../sheets";
import {EventRecord, RowWithNumber, SlotType} from "../types";
import {ApiError, generateId, normalizeEmail} from "../utils";

const slotTypeSchema = z.enum(["staff", "volunteer"]);
const eventStatusSchema = z.enum(["draft", "open", "completed", "cancelled"]);

const createEventSchema = z.object({
  schoolId: z.string().trim().min(1),
  eventDate: z.string().trim().min(1),
  dayOfWeek: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  timeNotes: z.string().trim().optional().default(""),
  eventType: z.string().trim().min(1),
  arrivalNotes: z.string().trim().optional().default(""),
  needsStaff: z.boolean(),
  needsVolunteer: z.boolean(),
  status: eventStatusSchema.optional().default("draft"),
});

const updateEventSchema = z.object({
  schoolId: z.string().trim().min(1).optional(),
  eventDate: z.string().trim().min(1).optional(),
  dayOfWeek: z.string().trim().min(1).optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  timeNotes: z.string().trim().optional(),
  eventType: z.string().trim().min(1).optional(),
  arrivalNotes: z.string().trim().optional(),
  needsStaff: z.boolean().optional(),
  needsVolunteer: z.boolean().optional(),
  status: eventStatusSchema.optional(),
  followupNotes: z.string().trim().optional(),
  leadCardsCount: z.union([z.number(), z.string(), z.null()]).optional(),
});

export function eventsRouter(sheets: SheetsService): Router {
  const router = Router();

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      const [events, schools, claims] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
        sheets.getClaims(),
      ]);
      const activeClaims = claims.filter((claim) => claim.claimStatus === "active");
      const visibleEvents = user.role === "volunteer" ?
        events.filter((event) => event.status !== "draft") :
        events;

      res.json(joinEvents(visibleEvents, schools, activeClaims));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      if (!canManageEvents(user.role)) {
        throw new ApiError(403, "Only staff and admins can create events.");
      }

      const body = parseBody(createEventSchema, req.body);
      const schools = await sheets.getSchools();
      if (!schools.some((school) => school.schoolId === body.schoolId)) {
        throw new ApiError(400, "schoolId does not match a row in Schools.");
      }

      const now = new Date().toISOString();
      const event: EventRecord = {
        eventId: generateId("EVT"),
        schoolId: body.schoolId,
        eventDate: body.eventDate,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        timeNotes: body.timeNotes,
        eventType: body.eventType,
        arrivalNotes: body.arrivalNotes,
        needsStaff: body.needsStaff,
        needsVolunteer: body.needsVolunteer,
        status: body.status,
        followupNotes: "",
        leadCardsCount: null,
        createdBy: user.email,
        createdAt: now,
        updatedAt: now,
      };

      await sheets.appendEvent(event);
      res.status(201).json(joinEvent(event, schools, []));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:eventId", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      if (!canManageEvents(user.role)) {
        throw new ApiError(403, "Only staff and admins can update events.");
      }

      const body = parseBody(updateEventSchema, req.body);
      const [events, schools, claims] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
        sheets.getClaims(),
      ]);
      const event = findEvent(events, String(req.params.eventId));

      if (body.schoolId && !schools.some((school) => school.schoolId === body.schoolId)) {
        throw new ApiError(400, "schoolId does not match a row in Schools.");
      }

      const leadCardsCount = body.leadCardsCount === undefined ?
        event.leadCardsCount :
        normalizeLeadCardsCount(body.leadCardsCount);
      const updatedEvent: RowWithNumber<EventRecord> = {
        ...event,
        schoolId: body.schoolId ?? event.schoolId,
        eventDate: body.eventDate ?? event.eventDate,
        dayOfWeek: body.dayOfWeek ?? event.dayOfWeek,
        startTime: body.startTime ?? event.startTime,
        endTime: body.endTime ?? event.endTime,
        timeNotes: body.timeNotes ?? event.timeNotes,
        eventType: body.eventType ?? event.eventType,
        arrivalNotes: body.arrivalNotes ?? event.arrivalNotes,
        needsStaff: body.needsStaff ?? event.needsStaff,
        needsVolunteer: body.needsVolunteer ?? event.needsVolunteer,
        status: body.status ?? event.status,
        followupNotes: body.followupNotes ?? event.followupNotes,
        leadCardsCount,
        updatedAt: new Date().toISOString(),
      };

      await sheets.updateEvent(updatedEvent);
      const activeClaims = claims.filter((claim) => claim.claimStatus === "active");
      res.json(joinEvent(updatedEvent, schools, activeClaims));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:eventId/claims", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      const slotType = parseBody(z.object({slotType: slotTypeSchema}), req.body).slotType;
      if (!canClaimSlot(user.role, slotType)) {
        throw new ApiError(403, "User role cannot claim this slot type.");
      }

      const [events, schools] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
      ]);
      const event = findEvent(events, String(req.params.eventId));
      validateClaimableEvent(event, slotType);

      const claims = await sheets.getClaims();
      const activeClaim = getActiveClaimForSlot(claims, event.eventId, slotType);
      if (activeClaim) {
        throw new ApiError(409, "This slot is already claimed.");
      }

      const now = new Date().toISOString();
      const claim = {
        claimId: generateId("CLM"),
        eventId: event.eventId,
        slotType,
        userEmail: user.email,
        userName: user.fullName,
        claimStatus: "active" as const,
        claimedAt: now,
        canceledAt: "",
        cancelledBy: "",
        cancelReason: "",
      };

      await sheets.appendClaim(claim);
      const activeClaims = [...claims.filter((item) => item.claimStatus === "active"), claim];
      res.status(201).json(joinEvent(event, schools, activeClaims));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:eventId/claims/:slotType", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      const slotType = parseBody(slotTypeSchema, String(req.params.slotType));
      const [events, schools, claims] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
        sheets.getClaims(),
      ]);
      const event = findEvent(events, String(req.params.eventId));
      const claim = claims.find((item) =>
        item.eventId === event.eventId &&
        item.slotType === slotType &&
        item.claimStatus === "active",
      );

      if (!claim) {
        throw new ApiError(404, "No active claim exists for this slot.");
      }

      const ownsClaim = normalizeEmail(claim.userEmail) === user.email;
      if (user.role !== "admin" && !ownsClaim) {
        throw new ApiError(403, "Only admins can cancel another user's claim.");
      }

      const updatedClaim = {
        ...claim,
        claimStatus: "cancelled" as const,
        canceledAt: new Date().toISOString(),
        cancelledBy: user.email,
      };

      await sheets.updateClaim(updatedClaim);
      const activeClaims = claims
        .filter((item) => item.claimId !== claim.claimId)
        .filter((item) => item.claimStatus === "active");
      res.json(joinEvent(event, schools, activeClaims));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseBody<T>(schema: z.ZodType<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, error.issues.map((issue) => issue.message).join("; "));
    }

    throw error;
  }
}

function findEvent(
  events: RowWithNumber<EventRecord>[],
  eventId: string,
): RowWithNumber<EventRecord> {
  const event = events.find((item) => item.eventId === eventId);
  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  return event;
}

function validateClaimableEvent(event: EventRecord, slotType: SlotType): void {
  if (event.status !== "open") {
    throw new ApiError(400, "Only open events can be claimed.");
  }

  if (slotType === "staff" && !event.needsStaff) {
    throw new ApiError(400, "This event does not need a staff claim.");
  }

  if (slotType === "volunteer" && !event.needsVolunteer) {
    throw new ApiError(400, "This event does not need a volunteer claim.");
  }
}

function normalizeLeadCardsCount(value: string | number | null): number | null {
  if (value === null || value === "") {
    return null;
  }

  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) {
    throw new ApiError(400, "leadCardsCount must be blank, null, or a number >= 0.");
  }

  return count;
}
