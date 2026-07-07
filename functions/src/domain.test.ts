import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAvailability,
  canClaimSlot,
  daysUntil,
  getActiveClaimForSlot,
  isPriorityEvent,
} from "./domain";
import {ClaimRecord, EventRecord} from "./types";
import {normalizeBoolean} from "./utils";

const openEvent: EventRecord = {
  eventId: "EVT-1",
  schoolId: "SCH-1",
  eventDate: "2026-08-28",
  dayOfWeek: "Friday",
  startTime: "5:00 PM",
  endTime: "7:00 PM",
  timeNotes: "",
  eventType: "Open House",
  arrivalNotes: "",
  needsStaff: true,
  needsVolunteer: true,
  status: "open",
  followupNotes: "",
  leadCardsCount: null,
  createdBy: "staff@example.com",
  createdAt: "2026-07-06T12:00:00.000Z",
  updatedAt: "2026-07-06T12:00:00.000Z",
};

const activeVolunteerClaim: ClaimRecord = {
  claimId: "CLM-1",
  eventId: "EVT-1",
  slotType: "volunteer",
  userEmail: "volunteer@example.com",
  userName: "Volunteer Person",
  claimStatus: "active",
  claimedAt: "2026-07-06T12:00:00.000Z",
  canceledAt: "",
  cancelledBy: "",
  cancelReason: "",
};

test("normalizeBoolean accepts sheet and boolean values", () => {
  assert.equal(normalizeBoolean("TRUE"), true);
  assert.equal(normalizeBoolean("true"), true);
  assert.equal(normalizeBoolean(true), true);
  assert.equal(normalizeBoolean("FALSE"), false);
  assert.equal(normalizeBoolean(false), false);
  assert.equal(normalizeBoolean(""), false);
});

test("canClaimSlot enforces role claim rules", () => {
  assert.equal(canClaimSlot("admin", "staff"), true);
  assert.equal(canClaimSlot("admin", "volunteer"), true);
  assert.equal(canClaimSlot("staff", "staff"), true);
  assert.equal(canClaimSlot("staff", "volunteer"), false);
  assert.equal(canClaimSlot("volunteer", "volunteer"), true);
  assert.equal(canClaimSlot("volunteer", "staff"), false);
});

test("calculateAvailability reports partially covered events", () => {
  assert.deepEqual(calculateAvailability(openEvent, null, activeVolunteerClaim), {
    staffSlotAvailable: true,
    volunteerSlotAvailable: false,
    coverageStatus: "partially_covered",
  });
});

test("calculateAvailability reports terminal statuses as unavailable", () => {
  assert.deepEqual(calculateAvailability({...openEvent, status: "cancelled"}, null, null), {
    staffSlotAvailable: false,
    volunteerSlotAvailable: false,
    coverageStatus: "cancelled",
  });
});

test("daysUntil computes whole-day differences in UTC", () => {
  const now = new Date("2026-07-07T15:00:00.000Z");
  assert.equal(daysUntil("2026-07-07", now), 0);
  assert.equal(daysUntil("2026-07-10", now), 3);
  assert.equal(daysUntil("2026-07-06", now), -1);
  assert.equal(daysUntil("not-a-date", now), null);
});

test("isPriorityEvent flags open, soon, unclaimed events", () => {
  const now = new Date("2026-07-07T12:00:00.000Z");
  const soon = {status: "open" as const, eventDate: "2026-07-10"};
  const openSlot = {staffSlotAvailable: true, volunteerSlotAvailable: false};

  assert.deepEqual(isPriorityEvent(soon, openSlot, now), {
    priority: true,
    daysUntilEvent: 3,
  });

  // Fully covered soon event is not priority.
  assert.equal(
    isPriorityEvent(soon, {staffSlotAvailable: false, volunteerSlotAvailable: false}, now).priority,
    false,
  );

  // Open slot but outside the 7-day window is not priority.
  assert.equal(
    isPriorityEvent({status: "open", eventDate: "2026-07-20"}, openSlot, now).priority,
    false,
  );

  // Draft event is never priority.
  assert.equal(
    isPriorityEvent({status: "draft", eventDate: "2026-07-08"}, openSlot, now).priority,
    false,
  );
});

test("getActiveClaimForSlot ignores cancelled claims", () => {
  const activeClaim = getActiveClaimForSlot([
    {...activeVolunteerClaim, claimStatus: "cancelled"},
    activeVolunteerClaim,
  ], "EVT-1", "volunteer");

  assert.equal(activeClaim?.claimId, "CLM-1");
});
