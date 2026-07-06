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
