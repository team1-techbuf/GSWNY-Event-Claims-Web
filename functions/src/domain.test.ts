import assert from "node:assert/strict";
import test from "node:test";
import {calculateAvailability, canClaimSlot, getActiveClaimForSlot} from "./domain";
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

test("getActiveClaimForSlot ignores cancelled claims", () => {
  const activeClaim = getActiveClaimForSlot([
    {...activeVolunteerClaim, claimStatus: "cancelled"},
    activeVolunteerClaim,
  ], "EVT-1", "volunteer");

  assert.equal(activeClaim?.claimId, "CLM-1");
});
