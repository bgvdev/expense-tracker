# Configuration Audit

> **⚠️ HISTORICAL DOCUMENT — do not treat as current.**
> This is a point-in-time snapshot from **2026-06-08**. It predates the admin
> panel, payment methods, password reset, reports/charts, and pagination, as well
> as the P0/P1 remediation of 2026-08. It is kept for provenance only.
> For current behaviour see `CLAUDE.md` and `docs/ARCHITECTURE.md`.

This document records the findings from the infrastructure and configuration audit conducted on 2026-06-08 and the fixes applied.

---

## Hardcoded URLs — Before / After

### 1. Frontend API URL
**File:** `frontend/src/lib/api.ts:1`

Before:
```ts
const BASE_URL = 'https://expense-tracker-funw.onrender.com';
```

After:
```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://expense-tracker-funw.onrender.com';
```

The production URL is kept as a fallback so the app continues working on Vercel if the env var is accidentally omitted.

---

### 2. CORS Allowed Origins
**File:** `backend/config/cors.php:22-25`

Before:
```php
'allowed_origins' => [
    'https://trakspend.vercel.app',
    'http://localhost:3000'
],
```

After:
```php
'allowed_origins' => array_filter(
    array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'https://trakspend.vercel.app,http://localhost:3000')))
),
```

Set `CORS_ALLOWED_ORIGINS=https://trakspend.vercel.app` in production env. No code change needed when the frontend URL changes.

---

### 3. Sanctum Stateful Domains
**File:** `backend/config/sanctum.php:18-21`

Before:
```php
'stateful' => [
    'trakspend.vercel.app',
    'localhost',
    '127.0.0.1'
],
```

After:
```php
'stateful' => array_filter(
    array_map('trim', explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', 'trakspend.vercel.app,localhost,127.0.0.1')))
),
```

---

## Hardcoded Secrets — Before / After

### 4. Test User Seeded in Production (CRITICAL)
**File:** `backend/database/seeders/DatabaseSeeder.php`

Before: `test@example.com` / `password` was always created by the seeder, and the entrypoint ran `db:seed --force` unconditionally on every container start.

After: Creation is guarded by `SEED_TEST_USER` env var. The entrypoint also checks the same variable before calling `db:seed`. Production deployments set `SEED_TEST_USER=false`.

**Action required:** Verify the `test@example.com` account has been deleted from the production Neon database:
```sql
DELETE FROM "user" WHERE email = 'test@example.com';
```

---

### 5. Weak DB Password Default
**File:** `docker-compose.yml`

Before: `${DB_PASSWORD:-secret}` — fallback to `secret` if env var not set.

After: `${DB_PASSWORD:?DB_PASSWORD must be set in .env}` — Docker Compose errors out immediately if the variable is missing, forcing the developer to set a real password.

---

## Docker Compose — Before / After

### 6. Hardcoded APP_ENV / APP_DEBUG
Before:
```yaml
APP_ENV: local
APP_DEBUG: "true"
```

After:
```yaml
APP_ENV: ${APP_ENV:-local}
APP_DEBUG: ${APP_DEBUG:-false}
```

Default is `false` for debug. Override per-environment via `.env` or shell.

### 7. APP_KEY not injected
Before: `APP_KEY` was not in the Compose environment, so the container relied entirely on the volume-mounted `backend/.env`. If `.env` was absent, the entrypoint auto-generated a new key on every start, invalidating all tokens.

After: `APP_KEY: ${APP_KEY}` is explicitly passed through from the host environment.

### 8. Dead NEXT_PUBLIC_API_URL in web service
Before: `NEXT_PUBLIC_API_URL: http://localhost:8000` was set in the `web` service but `api.ts` never read it (hardcoded URL).

After: `NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000}` — now readable from `.env` and actually used by `api.ts`.

---

## Other Fixes

### 9. Frontend Dockerfile — production stage added
A multi-stage `builder` + `production` stage was added to `frontend/Dockerfile`. The dev stage is unchanged for local use. The production stage uses `output: "standalone"` (already set in `next.config.ts`).

### 10. Unused `axios` dependency removed
`axios` was listed in `frontend/package.json` but the codebase uses native `fetch` exclusively. Removed to reduce bundle size.

### 11. SESSION_DRIVER changed to cookie
The app uses stateless Bearer token auth — no server-side sessions are ever created. Changed `SESSION_DRIVER` from `database` to `cookie` to avoid populating the unused `sessions` table.

### 12. APP_URL corrected in .env
Changed from `http://localhost` to the actual Render production URL so Artisan-generated URLs are correct.

### 13. README updated
- Corrected backend host from Railway to Render
- Added Neon to the infrastructure table
- Added local setup env-file copy step

---

## Remaining Known Issues

| ID | Issue | Status |
|----|-------|--------|
| M4-NOTE | Frontend Dockerfile production stage is added but Compose still uses the `node:20-alpine` image for the `web` service (dev mode). This is intentional — use the production Dockerfile only for explicit containerized production builds. | By design |
| DB-CLEANUP | `test@example.com` account may exist in the production Neon DB from before this fix. **Must be manually deleted.** | Action required |
