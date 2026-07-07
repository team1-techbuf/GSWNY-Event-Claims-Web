# Backend Contract

Base path is the deployed Function URL or same-origin `/api` when served through Firebase Hosting.

All protected endpoints require:

```text
Authorization: Bearer <Firebase ID token>
```

The API verifies the Firebase token, requires a verified email, normalizes the email, loads the matching row from `Users`, and requires `active` to be `TRUE`. Unauthenticated requests return `401`. Authenticated users with unverified email, missing from `Users`, or inactive users return `403`.

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
`volunteer` and `active` set to `FALSE`.

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

Returns an array of schools with camelCase field names.

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
      "notes": ""
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
    }
  }
]
```

Coverage status values are `uncovered`, `needs_staff`, `needs_volunteer`, `partially_covered`, `fully_covered`, `not_needed`, `cancelled`, `completed`, and `draft`.

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
