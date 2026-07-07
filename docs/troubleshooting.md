# Troubleshooting

Common problems and how to fix them, written for non‑technical helpers and
admins. Most issues come down to the **Google Sheet** (a typo, a wrong value, or
someone not approved yet) rather than the app itself.

> **First two things to try for almost anything:**
> 1. Have the person **refresh the page** (or fully close and reopen the app). The
>    app reads fresh data from the sheet each time.
> 2. Check the person's row in the **Users** tab of the sheet.

---

## Sign‑in and access

### "I can't log in" / "Wrong email or password"
- Passwords are case‑sensitive; have them retype it carefully.
- Make sure they're using the **same email** that's in the **Users** tab.
- If they never set a password, they need to **Sign up** first (not sign in).
- Repeated failures can trigger a temporary lockout — wait a few minutes.

### "Please verify your email before using the app"
- The app sent a verification link when they signed up. They should open their
  email and click it, then tap **"I've verified"** in the app.
- Can't find it? Check spam, then use **Resend email** on that screen.

### "Almost there / awaiting approval"
- This means their email is verified but they aren't active in the sheet yet.
- **Volunteers** normally activate automatically once they verify — have them
  refresh. If they're still stuck, open the **Users** tab, find their row, and set
  **`active` = `TRUE`**.
- **Staff/admins** must be added by hand: confirm their row has the right
  **`role`** and `active = TRUE`.

### "You are not allowed to perform that action"
- Their **role** doesn't permit it. Only `staff`/`admin` can create/edit events;
  only `admin` can cancel someone else's claim. Update their `role` in the sheet if
  appropriate.

### A volunteer can see the **Staff** tab (or a staff member can't)
- The tab is controlled by the `role` column in the **Users** tab. Set it to
  `staff` (or `admin`) to show it, `volunteer` to hide it. Have them refresh after.

---

## Events

### "I don't see any events" (or a specific event is missing)
- **Volunteers can't see drafts.** If an event is in `draft` status it's hidden
  from volunteers — a staff member must **Publish** it (or set `status = open`).
- Check the **filters** on the Events tab — an active filter (zip, date, etc.) may
  be hiding it. Tap **Filter → Clear all**.
- Confirm the event's row in the **Events** tab has the right `status` and a valid
  `school_id` that exists in the **Schools** tab.

### "I can't claim an event"
- The slot may already be taken, or the event may not need that role. Refresh to
  see the current status.
- Volunteers can only claim **volunteer** slots; staff can only claim **staff**
  slots; admins can claim either.
- Only **`open`** events can be claimed (not draft, completed, or cancelled).

### "This slot was just claimed by someone else"
- Two people tried at the same moment and the other person got it. This is normal
  and expected — refresh to see who's on it.

### A school isn't showing on the **map**
- The school needs **latitude** and **longitude** in the **Schools** tab. Add them
  (see [google-sheet-setup.md](google-sheet-setup.md#getting-latitude--longitude-no-coding-needed)).
  The event still works everywhere else in the meantime.
- If **no** map appears at all (blank/gray box), the device may be offline — the
  map needs an internet connection to load.

---

## Emails

### "I claimed/dropped an event but got no email"
- Emails are **best‑effort** — they never block claiming, and a missing email
  doesn't mean the claim failed. Check the app; if the slot shows their name, the
  claim worked.
- If **nobody** is receiving emails, email sending probably isn't configured yet
  (the `SMTP_*` settings). Until it is, the app records emails in the server log
  instead of sending them. See [deployment.md](deployment.md) step 3 and
  [environment.md](environment.md). This one needs a developer/admin.

### "Notify volunteers" says it worked but no one got an email
- Same as above — check that SMTP is configured. Also confirm there are active
  volunteers to notify (rows in **Users** with `role = volunteer` and
  `active = TRUE`).

---

## "The app shows an error" / a red message

- Most red messages come straight from the app and describe the problem (e.g.
  "schoolId does not match a row in Schools"). Read it — it usually points at a
  sheet value to fix.
- **"Your session expired"** — have them sign in again.
- A one‑off glitch? Refresh and retry. If it keeps happening for everyone, the API
  or the sheet connection may be down — see the next section.

---

## Nothing loads for anyone

If **all** users suddenly can't load events, the problem is likely the connection
between the app and the sheet:

1. Open the **Google Sheet** and confirm it still exists and hasn't been renamed.
2. Confirm the **Share** list still includes the service account robot email
   (ends in `…iam.gserviceaccount.com`). If it was removed, re‑share as **Editor**
   (see [google-sheet-setup.md](google-sheet-setup.md#connecting-the-sheet-to-the-app-one-time-setup)).
3. Confirm no **tab or header row was renamed**.
4. If those look fine, a developer should check the Firebase Functions logs
   (`firebase functions:log`).

---

## When to escalate to a developer

Bring in a developer if:
- Emails need to be turned on or changed (SMTP settings/secrets).
- The service account, Firebase project, or credentials need changes.
- The Functions logs need checking, or a new version needs deploying.
- An error mentions something technical you can't match to a sheet value.

Helpful details to give them: what the person did, the exact on‑screen message,
their email/role, and roughly when it happened.
