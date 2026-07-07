# GoScouts — GSWNY Event Claims

GoScouts is a mobile‑friendly web app that lets **Girl Scouts of Western New York**
staff and volunteers find school events, **claim a slot** to help, and keep track of
which events still need people. Staff can also **create and manage events** and
nudge volunteers when help is needed.

The app stores everything in a **Google Sheet**, so there is no complicated
database to run — the people who already manage the spreadsheet stay in control of
the data.

---

## What it does (in plain terms)

- **Sign in with an email and password.** New people can sign up; they get access
  once they verify their email (and, for the first time, are approved).
- **Browse events** in a list, an agenda by day, or on a **map**. The map pins each
  school and colors it by what it still needs (staff, volunteer, both, or covered).
- **Filter events** by status, zip code, service unit, date, and time of day
  (e.g. 8am–12pm).
- **Claim or drop a slot** with one tap. A confirmation email is sent automatically.
- **Priority flags** highlight events happening within the next 7 days that still
  need someone.
- **"Me" tab:** see the events you signed up for and, afterward, mark one
  **completed** and record how many lead cards you collected plus any notes.
- **Staff tools:** create/edit events, publish drafts, email volunteers about
  events that still need coverage, and review **Active** and **Completed** event
  lists (with sorting and filters). Volunteers never see the Staff tab.

Roles decide what each person can do: **volunteers** can claim; **staff** and
**admins** can also create and manage events.

---

## Documentation

Start with the guide that matches what you need to do:

| I want to… | Read this |
| --- | --- |
| Understand and edit the data (add users, schools, events) | **[docs/google-sheet-setup.md](docs/google-sheet-setup.md)** |
| Put the app online / update the live app | **[docs/deployment.md](docs/deployment.md)** |
| Fix a problem a user is reporting | **[docs/troubleshooting.md](docs/troubleshooting.md)** |
| Keep the app and spreadsheet healthy over time | **[docs/maintenance.md](docs/maintenance.md)** |
| Look up exact settings / environment variables | **[docs/environment.md](docs/environment.md)** |
| See the exact API the app uses (developers) | **[docs/backend-contract.md](docs/backend-contract.md)** |
| Test everything works after a change | **[docs/manual-test-checklist.md](docs/manual-test-checklist.md)** |

> **Not technical?** The Google Sheet setup, troubleshooting, and maintenance
> guides are written for you. The deployment guide is mostly for whoever puts the
> app online, but it starts with a plain‑language overview.

---

## How it fits together (technical overview)

```
Phone / browser
   │  (email + password sign‑in)
   ▼
React web app  ──►  Firebase Hosting  ──►  /api/**  ──►  Firebase Function (Express API)
                                                              │
                                                              ▼
                                                        Google Sheet
                                                (Users, Schools, Events, Claims)
```

- **Frontend:** Vite + React + TypeScript (in `src/`). Served as static files by
  **Firebase Hosting**.
- **Identity:** **Firebase Authentication** (email/password). The app requires a
  verified email.
- **API:** a **Firebase Function** (`functions/`) running an Express app. It checks
  each request's Firebase login, then reads/writes the Google Sheet.
- **Data:** a **Google Sheet** with tabs `Users`, `Schools`, `Events`, `Claims`,
  and `Config`. See the [sheet setup guide](docs/google-sheet-setup.md).
- **Email:** confirmation and "volunteers needed" emails are sent over SMTP, or
  logged if SMTP is not configured (safe for testing).
- **Maps:** OpenStreetMap tiles via Leaflet — **no API key or billing required**.

### Run it on your own computer (for developers)

You need [Node.js 24](https://nodejs.org/), the
[Firebase CLI](https://firebase.google.com/docs/cli) (`npm i -g firebase-tools`),
and Java (for the Firebase emulators).

```bash
# 1. Install dependencies
npm install
npm install --prefix functions

# 2. Configure local settings (copy the examples and fill them in)
cp .env.example .env.local                 # frontend Firebase keys
cp functions/.env.example functions/.env   # SHEET_ID + Google credentials
# See docs/environment.md for what each value means.

# 3. Start the backend (Functions emulator) in one terminal
npm run build --prefix functions
npm run emulators

# 4. Start the frontend in another terminal
npm run dev
```

Then open the printed local URL (usually http://localhost:5173). Sign‑in uses the
real Firebase project, so the email must exist in the `Users` sheet as active (or
sign up and verify). Emails are logged to the emulator terminal unless SMTP is set.

### Build, lint, and test

```bash
npm run build                      # build the frontend
npm run lint                       # lint the frontend
npm run build --prefix functions   # compile the API
npm run lint  --prefix functions   # lint the API
npm run test  --prefix functions   # run API unit tests
```

### Going live

See **[docs/deployment.md](docs/deployment.md)** for the full walkthrough. The short
version:

```bash
npm run build                      # build frontend into dist/
npm run build --prefix functions   # compile the API
firebase deploy                    # publish hosting + the API function
```
