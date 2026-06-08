# Security Checklist

## Authentication & Authorization

- [x] Bearer token auth (Sanctum) — stateless, no cookies in API
- [x] Tokens stored in `localStorage` — acceptable for SPA, aware of XSS risk
- [x] Passwords hashed with bcrypt (`BCRYPT_ROUNDS=12`)
- [x] Token revoked on logout (`currentAccessToken()->delete()`)
- [ ] Token expiry not configured — tokens never expire (`SANCTUM_EXPIRATION=null`)
- [ ] No rate limiting on `/api/auth/login` or `/api/auth/register` — brute-force possible
- [ ] No email verification (`MustVerifyEmail` not implemented)

**Recommended:**
```dotenv
# Set a token expiration (in minutes), e.g. 7 days:
SANCTUM_EXPIRATION=10080
```

Add throttle middleware to auth routes in `routes/api.php`:
```php
Route::middleware('throttle:10,1')->prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});
```

---

## Secrets Management

- [x] `backend/.env` is gitignored — secrets not in repository
- [x] `APP_KEY` is set via environment variable — not hardcoded
- [x] No API keys or secrets found hardcoded in source code (post-audit)
- [x] `DB_PASSWORD` has no default fallback in Docker Compose (fails fast if unset)
- [ ] `APP_KEY` is visible in Docker Compose environment on the host — consider a secrets manager for team environments
- [ ] Production `APP_KEY` is not rotated regularly

---

## Production Configuration

- [x] `APP_DEBUG=false` in production (post-fix)
- [x] `APP_ENV=production` set in Render
- [x] `SESSION_SECURE_COOKIE=true` in production
- [x] `SEED_TEST_USER=false` in production (post-fix)
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
- [x] Origins now env-driven (no hardcoded production URLs in code)
- [x] `supports_credentials: true` required for Bearer token pre-flight
- [ ] Wildcard `allowed_methods` and `allowed_headers` — consider restricting to only what's needed

---

## Input Validation

- [x] `RegisterRequest`, `LoginRequest`, `StoreExpenseRequest` validate all inputs
- [x] `amount` validated as numeric with minimum value
- [x] `category_id` validated as existing foreign key (`exists:category,id`)
- [ ] No max length validation on `description` field (text column, no cap)
- [ ] `spent_at` accepts any date — no upper bound prevents future dates

---

## Known Test Credentials (Action Required)

The `test@example.com` / `password` account may still exist in the production Neon database from before the `SEED_TEST_USER` guard was added.

**Verify and delete:**
```sql
-- Run in Neon SQL Editor or via Render Shell
SELECT id, email, created_at FROM "user" WHERE email = 'test@example.com';
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
