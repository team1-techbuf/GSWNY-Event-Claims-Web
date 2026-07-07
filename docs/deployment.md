# Publishing the App (Going Live)

This guide explains how to put GoScouts online so anyone with a link can use it,
and how to push updates later. Most steps are done **once**; after that, updating
the live app is three commands.

> **Plain‑language summary:** the app has two published pieces — the **website**
> people open, and the **API** that talks to the Google Sheet. Both live in a
> Google service called **Firebase**. You'll (1) set a few configuration values,
> (2) make sure Firebase is allowed to read your Google Sheet, and (3) run the
> publish command. A developer typically does the first setup; afterward, updates
> are routine.

---

## What you need first

- A Google account that is an **Owner/Editor** of the Firebase project
  (`gswny-event-claims`) and can edit the Google Sheet.
- **[Node.js 24](https://nodejs.org/)** installed.
- The **Firebase CLI**: `npm install -g firebase-tools`, then `firebase login`.
- The project code on your computer, with dependencies installed:
  ```bash
  npm install
  npm install --prefix functions
  ```

Confirm you're pointed at the right project (this repo already sets it as default):
```bash
firebase use gswny-event-claims
```

---

## One‑time setup

### 1. Turn on email/password sign‑in

In the [Firebase Console](https://console.firebase.google.com/) → your project →
**Build → Authentication → Sign‑in method**, enable **Email/Password**. Email
verification links are sent by the app automatically; no extra provider is needed.

### 2. Let the app read your Google Sheet

The API reads/writes the sheet using a Google **service account** (a robot
account). You must both (a) turn on the Sheets API and (b) share the sheet.

**Recommended (no key files): use the app's own identity.**
1. In the [Google Cloud Console](https://console.cloud.google.com/) for the
   `gswny-event-claims` project, enable the **Google Sheets API**
   (APIs & Services → Library → "Google Sheets API" → Enable).
2. Find the function's runtime service account email (Cloud Console → IAM, it looks
   like `…-compute@developer.gserviceaccount.com` or `…@appspot.gserviceaccount.com`).
3. **Share** the Google Sheet with that email as **Editor**.
4. Leave the `GOOGLE_SERVICE_ACCOUNT_*` values unset — the app will authenticate as
   itself (Application Default Credentials).

**Alternative: use a service‑account key file.** If you already have a service
account key (the project has used
`gswny-sheets@calcium-subject-501617-n3.iam.gserviceaccount.com`), enable the
Google Sheets API on **that** account's project, share the sheet with its email,
and provide the key to the deployed function via `GOOGLE_SERVICE_ACCOUNT_JSON`
(see step 3). Prefer the recommended option for production so no private key is
stored in config.

### 3. Set the API's configuration values

The deployed API reads its settings from a file named
**`functions/.env.gswny-event-claims`** (this file is git‑ignored and lives only on
the machine you deploy from). Create it with:

```bash
# functions/.env.gswny-event-claims
SHEET_ID=1NPpaNgnKp9ItCsRawi2WxHORHag5lvewSfOF02plSAU
ALLOWED_ORIGINS=https://gswny-event-claims.web.app,https://gswny-event-claims.firebaseapp.com

# Email delivery (optional). If left blank, the app logs emails instead of sending.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=GoScouts Events <no-reply@girlscoutswny.org>

# Only if you chose the "key file" credential option in step 2:
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
```

See **[environment.md](environment.md)** for what every value means.

> **Security note on email passwords:** `SMTP_PASS` and any service‑account key are
> sensitive. For a small deployment, keeping them in this deploy‑only, git‑ignored
> file is acceptable. For stronger security, move them into Google Secret Manager
> (`firebase functions:secrets:set SMTP_PASS`) — this requires a small code change
> to bind the secret, so ask a developer.

### 4. Set the website's Firebase keys

The website needs the project's public Firebase web keys, baked in at build time.
Copy `.env.example` to **`.env.production`** and fill in the values from Firebase
Console → Project settings → **Your apps** (Web app). Leave `VITE_API_BASE_URL`
**blank** — in production the website calls the API on its own domain via `/api`.

```bash
# .env.production
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=gswny-event-claims.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gswny-event-claims
VITE_FIREBASE_STORAGE_BUCKET=gswny-event-claims.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=…
VITE_API_BASE_URL=
```

---

## Publishing (and every future update)

From the project folder:

```bash
npm run build                      # 1. build the website into dist/
npm run build --prefix functions   # 2. compile the API
firebase deploy                    # 3. publish website + API
```

When it finishes, the CLI prints your live URL — typically
**https://gswny-event-claims.web.app**. That link is the app; share it with staff
and volunteers.

To publish only one piece:
```bash
firebase deploy --only hosting     # website only
firebase deploy --only functions   # API only
```

> The website and API are wired together automatically: the file `firebase.json`
> tells Firebase to send anything under `/api/**` to the API function, and
> everything else to the app. You don't need to configure that.

---

## Optional: a custom web address

To use an address like `events.girlscoutswny.org`:

1. Firebase Console → **Hosting → Add custom domain**.
2. Follow the prompts to add the DNS records with your domain provider.
3. After it's verified, add the new address to `ALLOWED_ORIGINS` in
   `functions/.env.gswny-event-claims` and redeploy the functions.

---

## After you deploy: quick check

Open the live URL and confirm:

- [ ] You can sign in (and a brand‑new account can sign up + verify email).
- [ ] Events load, and the map shows school pins.
- [ ] Claiming a slot works and a confirmation email arrives (or is logged).
- [ ] Staff see the Staff tab; volunteers do **not**.
- [ ] Creating/editing an event as staff saves to the sheet.

The full list is in **[manual-test-checklist.md](manual-test-checklist.md)**. If
something's wrong, see **[troubleshooting.md](troubleshooting.md)**.
