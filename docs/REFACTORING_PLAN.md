# Refactoring Plan

Status as of 2026-06-08.

---

## CRITICAL — Completed

### C1 — Test user seeded in production
- **Impact:** Anyone knowing `test@example.com` / `password` could log into the production app.
- **Risk:** HIGH — active backdoor account.
- **Fix applied:** `SEED_TEST_USER` env var guard added to `DatabaseSeeder.php` and `docker-entrypoint.sh`.
- **Action still required:** Manually delete `test@example.com` from the Neon production database.

---

## HIGH — Completed

### H1 — Hardcoded backend URL in `api.ts`
- **Impact:** Local Docker dev silently hit the production backend. No way to point the frontend at a different API without editing source code.
- **Risk:** Medium — data pollution, confusing development experience.
- **Fix applied:** `process.env.NEXT_PUBLIC_API_URL` with production URL as fallback. `frontend/.env.example` created.

### H2 — CORS origins hardcoded in `config/cors.php`
- **Impact:** Changing the frontend domain required a code edit and redeploy.
- **Risk:** Medium — operational friction, change-control risk.
- **Fix applied:** Reads from `CORS_ALLOWED_ORIGINS` env var.

### H3 — Sanctum domains hardcoded in `config/sanctum.php`
- **Impact:** Same as H2.
- **Fix applied:** Reads from `SANCTUM_STATEFUL_DOMAINS` env var.

### H4 — `APP_DEBUG: "true"` hardcoded in `docker-compose.yml`
- **Impact:** If Docker Compose were used for staging/production, debug mode would be permanently on, exposing stack traces.
- **Fix applied:** Changed to `${APP_DEBUG:-false}`.

---

## MEDIUM — Completed

### M1 — No `frontend/.env.example`
- **Fix applied:** Created `frontend/.env.example` with `NEXT_PUBLIC_API_URL`.

### M2 — DB password fallback `secret`
- **Fix applied:** Changed to `${DB_PASSWORD:?DB_PASSWORD must be set in .env}` — fails fast if unset.

### M3 — `APP_KEY` not injected in Docker Compose
- **Fix applied:** `APP_KEY: ${APP_KEY}` added to `api` service environment.

### M4 — Frontend Dockerfile dev-only
- **Fix applied:** Multi-stage `builder` + `production` stage added.

### M5 — `db:seed --force` ran unconditionally in entrypoint
- **Fix applied:** Gated behind `SEED_TEST_USER` check in `docker-entrypoint.sh`.

### M6 — `SESSION_DRIVER=database` with unused sessions
- **Fix applied:** Changed to `cookie` in `backend/.env` and `backend/.env.example`.

---

## LOW — Completed

### L1 — Unused `axios` dependency
- **Fix applied:** Removed from `frontend/package.json`.

### L2 — README referenced Railway (stale)
- **Fix applied:** Updated to Render + Neon.

### L3 — `FRONTEND_URL` env var declared but unused
- **Fix applied:** Removed from `.env.example` (replaced by `CORS_ALLOWED_ORIGINS` which is now actually wired up). Added note in comments.

### L4 — `APP_URL=http://localhost` in `.env`
- **Fix applied:** Updated to actual Render URL.

---

## Future Improvements (Not In Scope of This Audit)

These were not present in the codebase but would improve the project over time:

| Area | Suggestion |
|------|-----------|
| API completeness | Add PUT `/api/expenses/{id}` and DELETE `/api/expenses/{id}` endpoints |
| Input validation | Add rate limiting on auth endpoints (`ThrottleRequests` middleware) |
| Token expiry | Set `SANCTUM_TOKEN_EXPIRATION` — tokens currently never expire |
| CI/CD | Add GitHub Actions workflow: lint + test on PRs |
| Staging env | Add a staging environment (separate Render service + Neon branch) |
| Error monitoring | Add Sentry or Bugsnag for production error tracking |
| Auth hardening | Add email verification (`MustVerifyEmail`) |
| Currency | Dashboard hardcodes INR (`₹`) — consider making it configurable |
