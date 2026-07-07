import {
  ClaimRecord,
  ClaimSummary,
  CoverageStatus,
  EventRecord,
  SlotType,
  UserRole,
} from "./types";

export function canManageEvents(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function canClaimSlot(role: UserRole, slotType: SlotType): boolean {
  if (role === "admin") {
    return true;
  }

  return role === slotType;
}

export function getActiveClaimForSlot(
  claims: ClaimRecord[],
  eventId: string,
  slotType: SlotType,
): ClaimRecord | null {
  return claims.find((claim) =>
    claim.eventId === eventId &&
    claim.slotType === slotType &&
    claim.claimStatus === "active",
  ) ?? null;
}

export const PRIORITY_WINDOW_DAYS = 7;

// Number of whole days from `now` until an ISO-ish `eventDate` (YYYY-MM-DD).
// Returns null when the date cannot be parsed. Both dates are compared at day
// granularity in UTC so timezone drift does not flip a same-day comparison.
export function daysUntil(eventDate: string, now: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDate.trim());
  if (!match) {
    return null;
  }

  const eventUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((eventUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

// An event is priority when it is open, happens within the next
// PRIORITY_WINDOW_DAYS days (today included), and still has an unclaimed
// needed slot.
export function isPriorityEvent(
  event: Pick<EventRecord, "status" | "eventDate">,
  availability: {staffSlotAvailable: boolean; volunteerSlotAvailable: boolean},
  now: Date,
): {priority: boolean; daysUntilEvent: number | null} {
  const daysUntilEvent = daysUntil(event.eventDate, now);
  const hasOpenSlot = availability.staffSlotAvailable || availability.volunteerSlotAvailable;
  const priority = event.status === "open" &&
    hasOpenSlot &&
    daysUntilEvent !== null &&
    daysUntilEvent >= 0 &&
    daysUntilEvent <= PRIORITY_WINDOW_DAYS;

  return {priority, daysUntilEvent};
}

export function toClaimSummary(claim: ClaimRecord | null): ClaimSummary | null {
  if (!claim) {
    return null;
  }

  return {
    userEmail: claim.userEmail,
    userName: claim.userName,
    claimedAt: claim.claimedAt,
  };
}

export function calculateAvailability(
  event: Pick<EventRecord, "needsStaff" | "needsVolunteer" | "status">,
  staffClaim: ClaimRecord | null,
  volunteerClaim: ClaimRecord | null,
): {
  staffSlotAvailable: boolean;
  volunteerSlotAvailable: boolean;
  coverageStatus: CoverageStatus;
} {
  const staffNeededAndOpen = event.needsStaff && !staffClaim;
  const volunteerNeededAndOpen = event.needsVolunteer && !volunteerClaim;
  const staffSlotAvailable = event.status === "open" && staffNeededAndOpen;
  const volunteerSlotAvailable = event.status === "open" && volunteerNeededAndOpen;

  if (event.status === "draft" || event.status === "completed" || event.status === "cancelled") {
    return {
      staffSlotAvailable: false,
      volunteerSlotAvailable: false,
      coverageStatus: event.status,
    };
  }

  if (!event.needsStaff && !event.needsVolunteer) {
    return {
      staffSlotAvailable: false,
      volunteerSlotAvailable: false,
      coverageStatus: "not_needed",
    };
  }

  const missingStaff = event.needsStaff && !staffClaim;
  const missingVolunteer = event.needsVolunteer && !volunteerClaim;

  if (!missingStaff && !missingVolunteer) {
    return {
      staffSlotAvailable,
      volunteerSlotAvailable,
      coverageStatus: "fully_covered",
    };
  }

  if (missingStaff && missingVolunteer) {
    return {
      staffSlotAvailable,
      volunteerSlotAvailable,
      coverageStatus: "uncovered",
    };
  }

  if (missingStaff) {
    return {
      staffSlotAvailable,
      volunteerSlotAvailable,
      coverageStatus: event.needsVolunteer ? "partially_covered" : "needs_staff",
    };
  }

  if (missingVolunteer) {
    return {
      staffSlotAvailable,
      volunteerSlotAvailable,
      coverageStatus: event.needsStaff ? "partially_covered" : "needs_volunteer",
    };
  }

  return {
    staffSlotAvailable,
    volunteerSlotAvailable,
    coverageStatus: "partially_covered",
  };
}
