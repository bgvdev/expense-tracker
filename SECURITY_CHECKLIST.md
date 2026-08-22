# Security Checklist

## Authentication & Authorization

- [x] Bearer token auth (Sanctum) — stateless, no cookies in API
- [x] Tokens stored in `localStorage` — acceptable for SPA, aware of XSS risk
- [x] Passwords hashed with bcrypt (`BCRYPT_ROUNDS=12`, set in `render.yaml`)
- [x] Token revoked on logout (`currentAccessToken()->delete()`)
- [x] Token expiry configured — `SANCTUM_TOKEN_EXPIRATION`, default 7 days
- [x] All tokens revoked on password change and on password reset
- [x] Rate limiting on `/api/auth/*` (`throttle:10,1` per IP) **and** on every
      authenticated `/api` route (`API_RATE_LIMIT`, default 120/min, keyed by user)
- [x] Password-reset OTP: single-use, 15-minute expiry, hashed at rest, and the
      token row is discarded after 5 incorrect attempts
- [x] `email_verified_at` cleared when a user changes their email
- [ ] No email verification flow (`MustVerifyEmail` not implemented) — the column
      exists and is invalidated on change, but nothing sends or checks a
      verification link
- [ ] No authorization layer (no Policies/Gates). Ownership is enforced by
      per-query `where('user_id', ...)` clauses, which is consistent but ad hoc

---

## Secrets Management

- [x] Both the repo-root `.env` (which holds `DB_PASSWORD`/`APP_KEY` for Compose) and `backend/.env` are gitignored — verified with `git ls-files`, only the `.env.example` files are tracked
- [x] `APP_KEY` is set via environment variable — not hardcoded
- [x] No API keys or secrets found hardcoded in source code (post-audit)
- [x] `DB_PASSWORD` has no default fallback in Docker Compose (fails fast if unset)
- [ ] `APP_KEY` is visible in Docker Compose environment on the host — consider a secrets manager for team environments
- [ ] Production `APP_KEY` is not rotated regularly

---

## Production Configuration

- [x] `APP_DEBUG=false` in production (post-fix)
- [x] `APP_ENV=production` set in Render
- [x] `SESSION_SECURE_COOKIE=true` in production — now actually declared in `render.yaml`; this box previously claimed it while the variable was set nowhere
- [x] `SEED_TEST_USER=false` in production (post-fix)
- [x] Container runs as `www-data`, not root
- [x] `APP_KEY` absence is fatal outside local — it previously regenerated on every boot, silently invalidating encrypted payloads
- [x] Migrations failing means the container refuses to serve, and `/api/health` verifies the DB — a failed migration can no longer pass Render's health gate
- [x] HTTPS enforced by Render and Vercel (TLS termination at platform level)
- [x] `fastcgi_hide_header X-Powered-By` in Nginx config — PHP version not exposed
- [ ] Laravel `APP_DEBUG` response headers not explicitly stripped
- [ ] No `Content-Security-Policy` header on frontend
- [ ] No `X-Frame-Options` or `X-Content-Type-Options` headers configured

---

## Database

- [x] SSL/TLS required for Neon connection (`DB_SSLMODE=require`)
- [x] `user_id` foreign key with CASCADE DELETE — no orphaned expense rows
- [x] User data is scoped — expenses query always filters by `auth()->user()`
- [x] Parameterized queries via Eloquent — no raw SQL injection vectors found
- [ ] No database user least-privilege policy — Neon default user has full access
- [ ] No audit log for sensitive operations (deletes, password changes)

---

## CORS

- [x] CORS configured to allow only specific origins (not `*`)
- [x] Origins fully env-driven with **no production fallback** — an environment that forgets `CORS_ALLOWED_ORIGINS` now allows nothing, instead of silently trusting the production frontend
- [x] `supports_credentials: false` — no cookies are used anywhere, so credentialed requests are not needed (the earlier note claiming it was "required for Bearer token pre-flight" was incorrect; `Authorization` is a normal header, not a credential in the CORS sense)
- [x] `allowed_methods` and `allowed_headers` narrowed to what the API actually uses
- [x] `paths` narrowed to `api/*` — the unused `sanctum/csrf-cookie`, `login` and `register` entries were removed

---

## Input Validation

- [x] `RegisterRequest`, `LoginRequest`, `StoreExpenseRequest` validate all inputs
- [x] `amount` validated as numeric with both a minimum **and** a maximum matching the `decimal(10,2)` column — an over-large value used to reach Postgres and fail as a 500 numeric overflow
- [x] `category_id` validated as an existing, *accessible* foreign key (own or global)
- [x] `description` capped at 255 characters
- [x] `spent_at` bounded by `before_or_equal:today` — future dates are rejected
- [x] `per_page` clamped at both ends — `per_page=0` previously caused a division by zero and a negative value emitted a negative SQL `LIMIT`

---

## Known Test Credentials (Action Required)

The `test@example.com` / `password` account may still exist in the production Neon database from before the `SEED_TEST_USER` guard was added.

**Verify and delete** — use the Neon SQL Editor; the Render Shell is disabled on
the free plan:
```sql
SELECT id, email, created_at FROM "user" WHERE email = 'test@example.com';
-- expense rows cascade on user delete; the user's own categories cascade too
DELETE FROM "user" WHERE email = 'test@example.com';
```

---

## Security Headers (Frontend — not implemented)

Add these headers to `next.config.ts` for defense-in-depth:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
```

---

## Dependency Security

```bash
# Backend — check for known vulnerabilities
composer audit

# Frontend — check for known vulnerabilities
npm audit
```

Run these before each production release.
