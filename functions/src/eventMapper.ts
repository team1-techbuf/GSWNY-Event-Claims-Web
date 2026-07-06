import {
  ClaimRecord,
  EventRecord,
  JoinedEvent,
  School,
} from "./types";
import {
  calculateAvailability,
  getActiveClaimForSlot,
  toClaimSummary,
} from "./domain";

export function joinEvent(
  event: EventRecord,
  schools: School[],
  claims: ClaimRecord[],
): JoinedEvent {
  const staffClaim = getActiveClaimForSlot(claims, event.eventId, "staff");
  const volunteerClaim = getActiveClaimForSlot(claims, event.eventId, "volunteer");

  return {
    eventId: event.eventId,
    school: schools.find((school) => school.schoolId === event.schoolId) ?? null,
    eventDate: event.eventDate,
    dayOfWeek: event.dayOfWeek,
    startTime: event.startTime,
    endTime: event.endTime,
    timeNotes: event.timeNotes,
    eventType: event.eventType,
    arrivalNotes: event.arrivalNotes,
    needsStaff: event.needsStaff,
    needsVolunteer: event.needsVolunteer,
    status: event.status,
    followupNotes: event.followupNotes,
    leadCardsCount: event.leadCardsCount,
    staffClaim: toClaimSummary(staffClaim),
    volunteerClaim: toClaimSummary(volunteerClaim),
    availability: calculateAvailability(event, staffClaim, volunteerClaim),
  };
}

export function joinEvents(
  events: EventRecord[],
  schools: School[],
  claims: ClaimRecord[],
): JoinedEvent[] {
  return events.map((event) => joinEvent(event, schools, claims));
}
