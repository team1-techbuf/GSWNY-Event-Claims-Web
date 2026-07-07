# GSWNY Event Claims Web

Mobile web app for WNY Girl Scouts event slot claims. Staff create and manage school events; staff and volunteers sign in with Firebase Auth (email + password) to claim available event slots. Google Sheets is the v1 data store.

## Features

- Email + password auth with signup, email verification, and a pending-approval gate.
- Role-gated UI: volunteers can only claim; staff/admin can also add/edit/publish events. The Staff tab is hidden from volunteers.
- Filterable event list by status, zip code, service unit, date, and time block (e.g. 8am–12pm), with list, agenda, and map views.
- Map view (Leaflet + OpenStreetMap, no API key) with markers color-coded by coverage need (needs staff / volunteer / both) and per-school event popups with claim/drop. Schools are geocoded into `latitude`/`longitude` columns on the `Schools` tab.
- Priority badges for open events within 7 days that still need coverage.
- Claim and drop slots with confirmation emails to the affected member.
- Volunteers mark their claimed events completed from the "Me" tab and record lead-card counts and notes.
- Staff broadcast a "volunteers needed" email for uncovered upcoming events.
- Claim concurrency safety: concurrent double-claims are reconciled so exactly one active claim survives per slot.
- Hover and click animations throughout.

## Architecture

- Vite React TypeScript frontend in `src`.
- Firebase Auth email/password identity in the browser; an `AuthProvider` context resolves the approved app user and role.
- Firebase Functions TypeScript API exported as `api`.
- Express routes verify Firebase ID tokens with `firebase-admin`.
- New signups create inactive rows in the `Users` Google Sheet tab; verified web signups auto-activate.
- Approved app users and roles are read from the `Users` Google Sheet tab.
- Events are read from `Events`, joined with `Schools` and active `Claims`, and carry computed availability + priority.
- Claims append rows to `Claims`; cancellation marks claim rows as `cancelled`; concurrent claims are reconciled after append.
- Notifications are sent over SMTP (or logged when SMTP is unconfigured). See [docs/environment.md](docs/environment.md).
- Firebase Hosting serves the Vite `dist` directory and rewrites `/api/**` to the API function.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   npm install --prefix functions
   ```

2. Create `.env.local` for the frontend. See [docs/environment.md](docs/environment.md).

3. Configure Functions environment variables or local shell values:

   ```bash
   export SHEET_ID="your-google-sheet-id"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   export ALLOWED_ORIGINS="http://localhost:5173"
   ```

4. Enable Firebase Auth email/password in the Firebase project. Email
   verification is sent by the app after signup; it does not require a separate
   Firebase provider.

5. Share the Google Sheet with the service account email.

## Run Locally

Frontend:

```bash
npm run dev
```

Functions emulator:

```bash
npm run emulators
```

For local frontend-to-functions calls, set `VITE_API_BASE_URL` to the Functions emulator URL, for example:

```text
http://127.0.0.1:5001/gswny-event-claims/us-central1/api
```

## Build And Test

```bash
npm run build
npm run lint
npm run build --prefix functions
npm run lint --prefix functions
npm run test --prefix functions
```

## Deploy

Use the configured Firebase project alias in `.firebaserc`.

```bash
npm run build
npm run build --prefix functions
npm run deploy
```

Before production deploy, set Functions runtime environment/secrets for `SHEET_ID`, Google credentials or ADC access, and `ALLOWED_ORIGINS` with the Hosting origin.
