export type UserRole = "admin" | "staff" | "volunteer";
export type SlotType = "staff" | "volunteer";
export type EventStatus = "draft" | "open" | "completed" | "cancelled";
export type ClaimStatus = "active" | "cancelled";

export type CoverageStatus =
  | "uncovered"
  | "needs_staff"
  | "needs_volunteer"
  | "partially_covered"
  | "fully_covered"
  | "not_needed"
  | "cancelled"
  | "completed"
  | "draft";

export interface AppUser {
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  county: string;
  suNumber: string;
  notes: string;
}

export interface UserSignup {
  email: string;
  fullName: string;
}

export interface School {
  schoolId: string;
  ces: string;
  county: string;
  suNumber: string;
  schoolName: string;
  street: string;
  cityTown: string;
  zipCode: string;
  notes: string;
}

export interface EventRecord {
  eventId: string;
  schoolId: string;
  eventDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timeNotes: string;
  eventType: string;
  arrivalNotes: string;
  needsStaff: boolean;
  needsVolunteer: boolean;
  status: EventStatus;
  followupNotes: string;
  leadCardsCount: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimRecord {
  claimId: string;
  eventId: string;
  slotType: SlotType;
  userEmail: string;
  userName: string;
  claimStatus: ClaimStatus;
  claimedAt: string;
  canceledAt: string;
  cancelledBy: string;
  cancelReason: string;
}

export type RowWithNumber<T> = T & {
  rowNumber: number;
};

export interface ClaimSummary {
  userEmail: string;
  userName: string;
  claimedAt: string;
}

export interface JoinedEvent {
  eventId: string;
  school: School | null;
  eventDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timeNotes: string;
  eventType: string;
  arrivalNotes: string;
  needsStaff: boolean;
  needsVolunteer: boolean;
  status: EventStatus;
  followupNotes: string;
  leadCardsCount: number | null;
  staffClaim: ClaimSummary | null;
  volunteerClaim: ClaimSummary | null;
  availability: {
    staffSlotAvailable: boolean;
    volunteerSlotAvailable: boolean;
    coverageStatus: CoverageStatus;
  };
}
