# GSWNY Event Claims Web

Working vertical slice for WNY Girl Scouts event slot claims. Staff create school events and staff or volunteers sign in with Firebase Auth to claim available event slots. Google Sheets is the v1 data store.

## Architecture

- Vite React TypeScript frontend in `src`.
- Firebase Auth email/password identity in the browser.
- Firebase Functions TypeScript API exported as `api`.
- Express routes verify Firebase ID tokens with `firebase-admin`.
- Approved app users and roles are read from the `Users` Google Sheet tab.
- Events are read from `Events`, joined with `Schools` and active `Claims`.
- Claims append rows to `Claims`; cancellation marks claim rows as `cancelled`.
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

4. Enable Firebase Auth email/password in the Firebase project.

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
