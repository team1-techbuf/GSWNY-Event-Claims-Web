import {
  ClaimRecord,
  EventRecord,
  JoinedEvent,
  School,
} from "./types";
import {
  calculateAvailability,
  getActiveClaimForSlot,
  isPriorityEvent,
  toClaimSummary,
} from "./domain";

export function joinEvent(
  event: EventRecord,
  schools: School[],
  claims: ClaimRecord[],
  now: Date = new Date(),
): JoinedEvent {
  const staffClaim = getActiveClaimForSlot(claims, event.eventId, "staff");
  const volunteerClaim = getActiveClaimForSlot(claims, event.eventId, "volunteer");
  const availability = calculateAvailability(event, staffClaim, volunteerClaim);
  const {priority, daysUntilEvent} = isPriorityEvent(event, availability, now);

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
    availability,
    daysUntilEvent,
    priority,
  };
}

export function joinEvents(
  events: EventRecord[],
  schools: School[],
  claims: ClaimRecord[],
  now: Date = new Date(),
): JoinedEvent[] {
  return events.map((event) => joinEvent(event, schools, claims, now));
}
