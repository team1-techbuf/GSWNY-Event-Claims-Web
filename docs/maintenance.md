# Maintaining the App & Sheet

Routine upkeep for admins. Almost all of it happens in the **Google Sheet** — no
coding required. Keep this and **[google-sheet-setup.md](google-sheet-setup.md)**
handy.

---

## Everyday tasks

### Approve or add a person
- **Volunteers** approve themselves automatically after verifying their email —
  usually nothing to do.
- To **add staff/admin**, or approve someone manually: open the **Users** tab, add
  or edit their row, set `role` and `active = TRUE`. (See
  [who can get in](google-sheet-setup.md#who-can-get-in-the-users-tab).)

### Remove or pause someone's access
- Set their `active` to `FALSE` in the **Users** tab. Their history stays intact;
  they simply can't sign in until it's `TRUE` again.

### Add a new school
1. Add a row in the **Schools** tab with a new `school_id` (e.g. `SCH-0005`).
2. Fill in the name, address, `city_town`, `zip_code`, and `su_number`.
3. Add **latitude/longitude** so it appears on the map — see
   [getting coordinates](google-sheet-setup.md#getting-latitude--longitude-no-coding-needed).

### Create or fix an event
- Prefer creating events **inside the app** (Staff tab → **Add Event**) so all the
  bookkeeping fields are filled correctly.
- To fix one by hand, edit its row in the **Events** tab. Make sure `school_id`
  matches a real school and `status` is one of `draft`/`open`/`completed`/`cancelled`.

### Handle a mistaken claim
- Any admin can **drop** (cancel) a claim from within the app. In the sheet, a
  dropped claim shows `claim_status = cancelled` — this is normal; don't delete the
  row.

---

## Periodic upkeep (monthly is plenty)

- **Tidy old events.** Set past events that happened to `completed`, and ones that
  were called off to `cancelled`, so the lists stay meaningful.
- **Review users.** Deactivate people who have left; confirm staff/admin roles are
  still correct.
- **Check the map.** Any new school missing `latitude`/`longitude`? Add them.
- **Back up the sheet.** In Google Sheets: **File → Make a copy** (name it with the
  date), or **File → Download → Excel** to keep an offline copy. Do this before any
  large cleanup.
- **Skim for typos** in `status`, `role`, and `school_id` values — these are the
  usual causes of "it's not showing up".

---

## Data hygiene rules (why things break)

The app matches values **exactly**, so consistency matters:

- Statuses must be exactly `draft`, `open`, `completed`, or `cancelled`.
- Roles must be exactly `admin`, `staff`, or `volunteer`.
- Yes/no columns (`active`, `needs_staff`, `needs_volunteer`) must be `TRUE` or
  `FALSE`.
- Dates use `YYYY-MM-DD` (e.g. `2026-09-15`); times look like `5:00 PM`.
- Emails are **lowercase** and must match the person's login email.
- Never rename a **tab** or the **header row**; never reuse an ID.

If something stops showing up, 90% of the time it's one of the rules above. See
**[troubleshooting.md](troubleshooting.md)**.

---

## Occasional technical maintenance (developer/admin)

These are less frequent and may need someone comfortable with the tools:

- **Publish an update.** After any code change, rebuild and redeploy — see
  **[deployment.md](deployment.md)**. The commands are:
  ```bash
  npm run build
  npm run build --prefix functions
  firebase deploy
  ```
- **Turn on / change email delivery.** Update the `SMTP_*` values (see
  [environment.md](environment.md)) and redeploy the functions.
- **Rotate credentials.** If the service‑account key or SMTP password is changed,
  update the corresponding value and redeploy. If you switch service accounts,
  re‑share the sheet with the new robot email and enable the Google Sheets API on
  its project.
- **Check the logs** when something is wrong for everyone:
  ```bash
  firebase functions:log
  ```
- **Keep dependencies current.** Occasionally run `npm install` updates and re‑run
  the checks (`npm run lint`, `npm run test --prefix functions`) before deploying.
- **Bulk‑geocode schools (optional).** Coordinates can be added by hand (see the
  sheet guide). If you'd rather geocode many at once, a developer can script it
  against the OpenStreetMap Nominatim service and write the `latitude`/`longitude`
  columns.

---

## Safety reminders

- The Google Sheet is the single source of truth — **back it up** before big edits.
- Keep the **service account** on the sheet's Share list, or the app goes dark.
- Treat the service‑account key and SMTP password like passwords — don't paste them
  into chats, emails, or commits.
- Test after changes using **[manual-test-checklist.md](manual-test-checklist.md)**.
