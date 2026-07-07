# The Google Sheet (Your Database)

Everything the app shows comes from **one Google Sheet**. If you can use a
spreadsheet, you can manage the app's data. This guide explains what each tab and
column is for, and how to safely add people, schools, and events.

> **The golden rule:** Do **not** rename the tabs or the header row (the first row
> of each tab). The app looks for those exact names. You can freely add, edit, and
> reorder the **rows** underneath.

---

## The tabs at a glance

| Tab | What it holds |
| --- | --- |
| **Users** | Who is allowed into the app, and whether they are a volunteer, staff, or admin. |
| **Schools** | The schools where events happen, including their map location. |
| **Events** | Each scheduled event and whether it still needs staff/volunteers. |
| **Claims** | A record of who signed up for (or dropped) each event slot. |
| **Config** | A reference list of the allowed values (for humans — see note below). |
| **Instructions** | A plain‑text reminder of these rules inside the sheet itself. |

> **About the Config tab:** it's a handy reference showing the valid statuses,
> roles, event types, etc. It documents the rules; editing it does **not** change
> how the app behaves.

---

## Who can get in: the **Users** tab

Columns: `email`, `phone`, `full_name`, `role`, `active`, `county`, `su_number`, `notes`

- **email** — the person's login email, in **lowercase**. This must match the email
  they use to sign in.
- **full_name** — shown in the app and on claims.
- **role** — one of:
  - `volunteer` — can view and **claim** events only.
  - `staff` — can also **create/edit events** and email volunteers.
  - `admin` — same as staff, plus can cancel anyone's claim.
- **active** — `TRUE` means they can use the app; `FALSE` blocks them.
- **county / su_number** — optional, shown on their profile.
- **notes** — free text (the app writes signup notes here; you can too).

### How people get access

1. **Self sign‑up (volunteers):** A new person signs up in the app. A row is
   created automatically with role `volunteer` and `active = FALSE`. As soon as
   they **verify their email** and open the app, the app flips them to
   `active = TRUE` on its own. You don't have to do anything.
2. **Adding staff/admin:** Add a row yourself (or edit an existing one). Set
   `email`, `full_name`, `role = staff` (or `admin`), and `active = TRUE`.
3. **Blocking someone:** set their `active` to `FALSE`.
4. **Promoting/demoting:** change the `role` value.

> Changes take effect the next time the person opens or refreshes the app.

---

## Where events happen: the **Schools** tab

Columns: `school_id`, `ces`, `county`, `su_number`, `school_name`, `street`,
`city_town`, `zip_code`, `notes`, `latitude`, `longitude`

- **school_id** — a unique code like `SCH-0004`. Keep the `SCH-####` pattern and
  never reuse a number.
- **school_name / street / city_town / zip_code** — the address, shown in the app.
- **su_number** — service unit number (used by the event filters).
- **latitude / longitude** — the map location. **These make the school appear on
  the map.** If they're blank, the school's events still work everywhere else; they
  just won't show as a pin on the map view.

### Getting latitude & longitude (no coding needed)

1. Open [Google Maps](https://maps.google.com) and search the school's address.
2. **Right‑click the exact spot** and click the coordinates at the top of the menu
   (two numbers like `42.0918, -78.4347`). This copies them.
3. Paste the **first number into `latitude`** and the **second into `longitude`**.

That's it — the pin appears the next time the app loads.

---

## The events: the **Events** tab

Most events are created from inside the app (Staff tab → **Add Event**), so you
rarely edit this tab by hand. For reference, the columns are:

| Column | Meaning |
| --- | --- |
| `event_id` | Unique code (the app generates it, e.g. `EVT-…`). |
| `school_id` | Must match a `school_id` in the **Schools** tab. |
| `event_date` | The date, written as `YYYY-MM-DD` (e.g. `2026-09-15`). |
| `day_of_week` | e.g. `Monday` (the app fills this in). |
| `start_time` / `end_time` | e.g. `5:00 PM`. End time may be left blank ("TBD"). |
| `time_notes` | Extra timing info (e.g. "End time TBD"). |
| `event_type` | e.g. `Open House`, `Recruitment Night`, `Info Table`, `Other`. |
| `arrival_notes` | e.g. "Check in at the main office". |
| `needs_staff` / `needs_volunteer` | `TRUE` if that kind of helper is needed. |
| `status` | `draft`, `open`, `completed`, or `cancelled` (see below). |
| `followup_notes` | Notes recorded when the event is marked completed. |
| `lead_cards_count` | Number of lead cards collected (recorded on completion). |
| `created_by`, `created_at`, `updated_at` | Bookkeeping the app fills in. |

**Event status meanings:**

- `draft` — being prepared; **hidden from volunteers**. Staff can "Publish" it.
- `open` — live and claimable by helpers.
- `completed` — it happened; lead cards and notes may be recorded.
- `cancelled` — called off; not claimable.

---

## Sign‑up records: the **Claims** tab

You almost never touch this tab — the app manages it. Each row records one person
claiming one slot (staff or volunteer) for one event. When someone **drops** a
slot, the row is **not deleted**; its `claim_status` changes to `cancelled` so you
keep a full history.

If two people somehow claim the same slot at the same instant, the app
automatically keeps the first one and cancels the second (you may see an
auto‑cancelled row with a note explaining why).

---

## Connecting the sheet to the app (one-time setup)

The app reads and writes the sheet through a **service account** — a special
"robot" Google email. For the app to work, the sheet must be **shared** with that
robot email:

1. Click **Share** on the Google Sheet.
2. Paste the service account's email address (it ends in
   `…iam.gserviceaccount.com` — the current one is
   `gswny-sheets@calcium-subject-501617-n3.iam.gserviceaccount.com`).
3. Give it **Editor** access and share.

The [deployment guide](deployment.md) explains where this email comes from and the
one Google Cloud setting (the "Google Sheets API") that must be turned on.

---

## Do's and don'ts

**Do**
- Add and edit rows freely.
- Keep emails lowercase in the Users tab.
- Use the exact status/role words (`open`, `staff`, etc.).
- Make a copy of the sheet before big cleanups (**File → Make a copy**).

**Don't**
- Rename tabs or the header row.
- Delete the header row or reorder columns you don't understand.
- Reuse an old `school_id` or `event_id`.
- Remove the service account from **Share** (the app would stop working).

For routine upkeep (approving people, adding schools, monthly checks, backups), see
**[maintenance.md](maintenance.md)**.
