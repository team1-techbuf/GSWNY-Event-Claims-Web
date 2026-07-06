# Environment

Do not commit `.env` files, service account JSON, private keys, or generated build output.

## Frontend `.env.local`

Copy `.env.example` to `.env.local`, then fill in every `replace-with-*` value.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
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
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SERVICE_ACCOUNT_KEY=
ALLOWED_ORIGINS=
```

`SHEET_ID` is required.

Use one Google credential option:

- `GOOGLE_APPLICATION_CREDENTIALS`: local path to an uncommitted service account JSON file.
- `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON string secret/env var.
- Deployed ADC: share the Sheet with the deployed Function service account and rely on Google Application Default Credentials.

`ALLOWED_ORIGINS` is a comma-separated list. Localhost origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed by default. Add the Firebase Hosting origin before production use.
