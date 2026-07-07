# Environment & Settings Reference

This is the **technical reference** for every configuration value. If you're
setting the app up to go live, follow **[deployment.md](deployment.md)** — it walks
through these in order. To understand the data itself, see
**[google-sheet-setup.md](google-sheet-setup.md)**.

**Which file holds what:**

| File | Used for | Committed? |
| --- | --- | --- |
| `.env.local` | Frontend keys for **local development** | No (git‑ignored) |
| `.env.production` | Frontend keys baked into the **published** website | No (git‑ignored) |
| `functions/.env` | API settings for the **local emulator** | No (git‑ignored) |
| `functions/.env.<projectId>` | API settings for the **deployed** function (e.g. `functions/.env.gswny-event-claims`) | No (git‑ignored) |
| `*.env.example` | Templates showing the expected keys | Yes |

> Never commit real `.env` files, service‑account JSON, private keys, or the build
> output — they're git‑ignored on purpose.

## Frontend `.env.local`

Copy `.env.example` to `.env.local`, then fill in every `replace-with-*` value.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_BASE_URL=
```

For local emulators, `VITE_API_BASE_URL` is usually:

```text
http://127.0.0.1:5001/gswny-event-claims/us-central1/api
```

For deployed Hosting, it can be left blank if `/api/**` is rewritten to the `api` Function.

## Functions Environment/Secrets

For emulator use, copy `functions/.env.example` to `functions/.env`, then fill
in `SHEET_ID` and one Google credential option.

```text
SHEET_ID=
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_SERVICE_ACCOUNT_FILE=
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SERVICE_ACCOUNT_KEY=
ALLOWED_ORIGINS=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

`SHEET_ID` is required.

## Email Notifications

Claim/drop confirmations and the staff "volunteers needed" broadcast are sent
through SMTP. Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` (plus optional
`SMTP_PORT`, `SMTP_SECURE`, and `MAIL_FROM`) to enable real delivery. When these
are unset, messages are logged to the Functions console instead of sent, so the
app works end to end in local development without an SMTP provider. Email
delivery is best-effort: a mail failure never blocks the claim/drop/complete
action.

Do not add `FIREBASE_PROJECT_ID` or `GCLOUD_PROJECT` to `functions/.env`.
Firebase reserves those keys and the Functions emulator will reject the env
file if they are present.

Use one Google credential option:

- `GOOGLE_APPLICATION_CREDENTIALS`: local path to an uncommitted service account JSON file.
- `GOOGLE_SERVICE_ACCOUNT_FILE`: local path to an uncommitted service account JSON file. This is preferred with the Functions emulator because Firebase may override `GOOGLE_APPLICATION_CREDENTIALS` internally.
- `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON string secret/env var.
- Deployed ADC: share the Sheet with the deployed Function service account and rely on Google Application Default Credentials.

The Google Sheets API must be enabled for the Google Cloud project that owns
the chosen credentials. For the local service account currently used here, that
project is `calcium-subject-501617-n3`.

`ALLOWED_ORIGINS` is a comma-separated list. Localhost origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed by default. Add the Firebase Hosting origin before production use.
