# Backend Contract (API Reference)

> **For developers.** This is the exact HTTP contract between the web app and the
> Firebase Function. If you're not integrating with the API directly, you don't
> need this — see the [README](../README.md) and the setup/maintenance guides
> instead.

Base path is the deployed Function URL or same-origin `/api` when served through Firebase Hosting.

All protected endpoints require:

```text
Authorization: Bearer <Firebase ID token>
```

The API verifies the Firebase token, requires a verified email, normalizes the email, and loads the matching row from `Users`. Web signup rows are auto-activated after email verification. Other inactive users return `403`.

## GET /health

Public.

Response:

```json
{
  "ok": true,
  "service": "gswny-event-claims-api"
}
```

## POST /signups

Requires a valid Firebase ID token, but does not require an active `Users` row.
Creates an inactive `Users` row for the signed-in Firebase email if one does not
already exist.

Request:

```json
{
  "fullName": "Jane Smith"
}
```

Created rows use the existing `Users` sheet structure with `role` set to
`volunteer` and `active` set to `FALSE`. After the user verifies their Firebase
email, their next authenticated API request updates the row to `active=TRUE`.

## GET /me

Protected.

Returns the approved app user:

```json
{
  "email": "jane@example.com",
  "fullName": "Jane Smith",
  "role": "volunteer",
  "active": true,
  "county": "",
  "suNumber": ""
}
```

## GET /schools

Protected. Any approved user may read schools.

Returns an array of schools with camelCase field names, including `latitude` and
`longitude` (string values, blank if a school has not been geocoded). The `Schools`
tab has `latitude`/`longitude` columns; these power the Events map view.

## GET /events

Protected.

Role visibility:

- `admin`: all events.
- `staff`: all events.
- `volunteer`: all non-draft events.

Returns events joined with `Schools` and active `Claims`:

```json
[
  {
    "eventId": "EVT-0001",
    "school": {
      "schoolId": "SCH-0001",
      "ces": "Heather",
      "county": "Cattaraugus",
      "suNumber": "101",
      "schoolName": "Portville Elementary School",
      "street": "500 Elm St",
      "cityTown": "Portville",
      "zipCode": "14770",
      "notes": "",
      "latitude": "42.0340895",
      "longitude": "-78.3310632"
    },
    "eventDate": "2024-08-28",
    "dayOfWeek": "Wednesday",
    "startTime": "5:00 PM",
    "endTime": "7:00 PM",
    "timeNotes": "",
    "eventType": "Open House",
    "arrivalNotes": "",
    "needsStaff": true,
    "needsVolunteer": true,
    "status": "open",
    "followupNotes": "",
    "leadCardsCount": null,
    "staffClaim": null,
    "volunteerClaim": null,
    "availability": {
      "staffSlotAvailable": true,
      "volunteerSlotAvailable": true,
      "coverageStatus": "uncovered"
    },
    "daysUntilEvent": 3,
    "priority": true
  }
]
```

Coverage status values are `uncovered`, `needs_staff`, `needs_volunteer`, `partially_covered`, `fully_covered`, `not_needed`, `cancelled`, `completed`, and `draft`.

`daysUntilEvent` is the whole-day count from today to the event date (negative for past events, `null` if unparseable). `priority` is `true` when the event is `open`, starts within the next 7 days (today included), and still has at least one needed slot unclaimed. The frontend surfaces priority events first with a badge.

## POST /events

Protected. `staff` and `admin` only.

Request:

```json
{
  "schoolId": "SCH-0001",
  "eventDate": "2024-08-28",
  "dayOfWeek": "Wednesday",
  "startTime": "5:00 PM",
  "endTime": "7:00 PM",
  "timeNotes": "",
  "eventType": "Open House",
  "arrivalNotes": "",
  "needsStaff": true,
  "needsVolunteer": true,
  "status": "draft"
}
```

Rules:

- `schoolId` must exist in `Schools`.
- `status` defaults to `draft`.
- The API generates `event_id`, `created_by`, `created_at`, and `updated_at`.
- Returns `201` with the joined event object.

## PATCH /events/:eventId

Protected. `staff` and `admin` only.

Allowed fields:

```text
schoolId, eventDate, dayOfWeek, startTime, endTime, timeNotes, eventType,
arrivalNotes, needsStaff, needsVolunteer, status, followupNotes, leadCardsCount
```

Rules:

- Event must exist.
- New `schoolId`, when supplied, must exist.
- `status` must be `draft`, `open`, `completed`, or `cancelled`.
- `leadCardsCount` must be blank/null or a number >= 0.
- Returns the updated joined event.

## POST /events/:eventId/claims

Protected.

Request:

```json
{
  "slotType": "volunteer"
}
```

Rules:

- Event must exist and have `status` of `open`.
- `slotType` must be `staff` or `volunteer`.
- Requested slot must be needed by the event.
- `volunteer` users may claim only `volunteer`.
- `staff` users may claim only `staff`.
- `admin` users may claim either slot.
- The API rereads active claims before append.
- Existing active claim for the same `event_id + slot_type` returns `409`.
- Returns `201` with the updated joined event.
- Sends a claim-confirmation email to the claiming user's address (best-effort).

### Concurrency

Because Google Sheets cannot enforce a unique active claim per `event_id + slot_type`,
two users can append at nearly the same moment. After appending, the API re-reads
the `Claims` tab and picks a deterministic winner (earliest `claimed_at`, then
`claim_id`). A losing append rolls its own row back to `cancelled` and the request
returns `409`. Exactly one active claim survives per slot.

## DELETE /events/:eventId/claims/:slotType

Protected.

Rules:

- Event must exist.
- `slotType` must be `staff` or `volunteer`.
- Active claim must exist.
- Any user can cancel their own active claim.
- `admin` can cancel any active claim.
- Non-admin users cannot cancel another user's claim.
- The claim row is updated to `claim_status = cancelled`; it is not deleted.
- Returns the updated joined event.
- Sends a drop-confirmation email to the affected member (best-effort).

## POST /events/:eventId/complete

Protected.

Marks an event completed and records post-event details from the "Me" tab.

Request:

```json
{
  "leadCardsCount": 12,
  "followupNotes": "Great turnout, follow up with two families."
}
```

Rules:

- The caller must hold an active claim on the event, or be `staff`/`admin`.
- A `cancelled` event cannot be completed.
- `leadCardsCount` must be blank/null or a number >= 0.
- Sets `status = completed` and updates `lead_cards_count` / `followup_notes`.
- Returns the updated joined event.

## POST /events/:eventId/notify

Protected. `staff` and `admin` only.

Emails all active volunteers that an upcoming event still needs coverage.

Request:

```json
{
  "message": "We really need help at this open house!"
}
```

Rules:

- `message` is optional.
- Returns `{ "notified": <number of volunteers emailed> }`.
- Returns `400` if there are no active volunteers.
