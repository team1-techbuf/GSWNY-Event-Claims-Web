import {Router} from "express";
import {z, ZodError} from "zod";
import {AuthenticatedRequest, currentUser} from "../auth";
import {
  canClaimSlot,
  canManageEvents,
  getActiveClaimForSlot,
} from "../domain";
import {joinEvent, joinEvents} from "../eventMapper";
import {
  sendClaimConfirmation,
  sendDropConfirmation,
  sendVolunteersNeeded,
} from "../mailer";
import {SheetsService} from "../sheets";
import {ClaimRecord, EventRecord, RowWithNumber, SlotType} from "../types";
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

const completeEventSchema = z.object({
  leadCardsCount: z.union([z.number(), z.string(), z.null()]).optional(),
  followupNotes: z.string().trim().max(2000).optional(),
});

const notifySchema = z.object({
  message: z.string().trim().max(2000).optional().default(""),
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
      const claim: ClaimRecord = {
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

      // Concurrency safety: Google Sheets cannot enforce a unique active claim
      // per event+slot, so two users can append at nearly the same moment.
      // Re-read after writing and let the earliest claim win; a loser rolls
      // back its own row and gets a 409. See docs/backend-contract.md.
      const winner = await reconcileClaim(sheets, event.eventId, slotType, claim);
      if (winner.claimId !== claim.claimId) {
        throw new ApiError(409, "This slot was just claimed by someone else.");
      }

      const latestClaims = await sheets.getClaims();
      const activeClaims = latestClaims.filter((item) => item.claimStatus === "active");
      const joined = joinEvent(event, schools, activeClaims);

      await sendClaimConfirmation(user.email, user.fullName, slotType, joined);
      res.status(201).json(joined);
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
      const joined = joinEvent(event, schools, activeClaims);

      // Notify the member whose claim was dropped (may differ from actor when
      // an admin cancels on their behalf).
      await sendDropConfirmation(
        normalizeEmail(claim.userEmail),
        claim.userName,
        slotType,
        joined,
      );
      res.json(joined);
    } catch (error) {
      next(error);
    }
  });

  // Mark an event completed and record post-event details. The member holding
  // an active claim on the event can do this from their "Me" tab; staff and
  // admins may also complete any event.
  router.post("/:eventId/complete", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      const body = parseBody(completeEventSchema, req.body);
      const [events, schools, claims] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
        sheets.getClaims(),
      ]);
      const event = findEvent(events, String(req.params.eventId));

      const holdsClaim = claims.some((item) =>
        item.eventId === event.eventId &&
        item.claimStatus === "active" &&
        normalizeEmail(item.userEmail) === user.email,
      );
      if (!holdsClaim && !canManageEvents(user.role)) {
        throw new ApiError(403, "Only a claim holder or staff can complete this event.");
      }
      if (event.status === "cancelled") {
        throw new ApiError(400, "A cancelled event cannot be completed.");
      }

      const leadCardsCount = body.leadCardsCount === undefined ?
        event.leadCardsCount :
        normalizeLeadCardsCount(body.leadCardsCount);
      const updatedEvent: RowWithNumber<EventRecord> = {
        ...event,
        status: "completed",
        leadCardsCount,
        followupNotes: body.followupNotes ?? event.followupNotes,
        updatedAt: new Date().toISOString(),
      };

      await sheets.updateEvent(updatedEvent);
      const activeClaims = claims.filter((item) => item.claimStatus === "active");
      res.json(joinEvent(updatedEvent, schools, activeClaims));
    } catch (error) {
      next(error);
    }
  });

  // Staff/admin broadcast: email active volunteers that an upcoming event still
  // needs coverage.
  router.post("/:eventId/notify", async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = currentUser(req);
      if (!canManageEvents(user.role)) {
        throw new ApiError(403, "Only staff and admins can send notifications.");
      }

      const body = parseBody(notifySchema, req.body);
      const [events, schools, claims, users] = await Promise.all([
        sheets.getEvents(),
        sheets.getSchools(),
        sheets.getClaims(),
        sheets.getUsers(),
      ]);
      const event = findEvent(events, String(req.params.eventId));
      const activeClaims = claims.filter((item) => item.claimStatus === "active");
      const joined = joinEvent(event, schools, activeClaims);

      const recipients = users
        .filter((candidate) => candidate.active && candidate.role === "volunteer")
        .map((candidate) => normalizeEmail(candidate.email))
        .filter(Boolean);

      if (recipients.length === 0) {
        throw new ApiError(400, "There are no active volunteers to notify.");
      }

      await sendVolunteersNeeded(recipients, joined, body.message);
      res.json({notified: recipients.length});
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// Resolve concurrent claims for the same event+slot deterministically. The
// winner is the earliest active claim (by claimedAt, then claimId). Any other
// active claim by the same append is rolled back to `cancelled` so exactly one
// survives.
async function reconcileClaim(
  sheets: SheetsService,
  eventId: string,
  slotType: SlotType,
  ownClaim: ClaimRecord,
): Promise<ClaimRecord> {
  const claims = await sheets.getClaims();
  const active = claims.filter((item) =>
    item.eventId === eventId &&
    item.slotType === slotType &&
    item.claimStatus === "active",
  );

  if (active.length <= 1) {
    return ownClaim;
  }

  const winner = [...active].sort((a, b) => {
    if (a.claimedAt !== b.claimedAt) {
      return a.claimedAt < b.claimedAt ? -1 : 1;
    }
    return a.claimId < b.claimId ? -1 : 1;
  })[0];

  // Roll back every active claim that is not the winner but was created by this
  // request, so the loser does not leave a lingering active row.
  const loser = claims.find((item) =>
    item.claimId === ownClaim.claimId && item.claimStatus === "active",
  );
  if (loser && winner.claimId !== ownClaim.claimId) {
    await sheets.updateClaim({
      ...loser,
      claimStatus: "cancelled",
      canceledAt: new Date().toISOString(),
      cancelledBy: normalizeEmail(ownClaim.userEmail),
      cancelReason: "Auto-cancelled: slot already claimed (concurrency).",
    });
  }

  return winner;
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
