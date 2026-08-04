# Runbook — Production Troubleshooting

> **The Render Shell is disabled on the free plan.** Every remedy below is
> therefore shell-free: use the **Neon SQL Editor** for anything that needs
> database access, and Render **environment variables + redeploy** for anything
> that needs an artisan command. Migrations and reference-data seeding already run
> automatically in `backend/docker-entrypoint.sh` on every boot, so "redeploy" is
> the standard way to re-run them.

## Quick Reference

| Service | URL | Dashboard |
|---------|-----|-----------|
| Frontend | https://trakspend.vercel.app | https://vercel.com |
| Backend API | https://expense-tracker-funw.onrender.com | https://dashboard.render.com |
| Database | Neon | https://console.neon.tech |
| Health check | https://expense-tracker-funw.onrender.com/api/health | — |

---

## Symptom: Frontend shows blank page or crashes

**Check:**
1. Open browser DevTools → Console — look for fetch errors.
2. Check if the API is reachable: `curl https://expense-tracker-funw.onrender.com/api/health`
3. Check Vercel deployment logs: Vercel Dashboard → Project → Deployments → latest → Build Logs.

**Common causes:**
- Vercel build failed — check Build Logs for TypeScript or lint errors.
- **`BACKEND_URL` missing in Vercel env vars** — the build now *fails* with
  `BACKEND_URL must be set for a production build` rather than silently falling
  back to a hardcoded URL. Set it in Vercel → Settings → Environment Variables and
  redeploy. It is read at build time, so a redeploy is required after changing it.
- Latest deploy wasn't promoted — check if the Production deployment is the latest.

**Fix:**
```bash
# Trigger a manual redeploy via Vercel dashboard, or force-push to main
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## Symptom: API returns 500 or is unreachable

**Check:**
1. `curl -i https://expense-tracker-funw.onrender.com/api/health`
   - `200 {"status":"ok","database":"ok"}` — app and database are both fine.
   - `503 {"status":"error","database":"unavailable"}` — app is up, database is not.
     Go straight to Neon (check the project isn't suspended, and that
     `DATABASE_URL` is current).
   - No response / 502 — the container is not serving. See below.
2. Render dashboard → Service → Logs — look for PHP errors or migration failures.

**Common causes:**
- **`FATAL: APP_KEY is not set`** in the logs — the container refuses to boot.
  Set `APP_KEY` in Render env vars and redeploy. (It no longer self-generates,
  which used to silently invalidate encrypted payloads on every restart.)
- **`FATAL: migrations did not succeed after 10 attempts`** — the container exits
  deliberately rather than serving an un-migrated schema, so Render will show it
  restarting. See "Database migrations fail on deploy" below.
- `DATABASE_URL` / `DB_MIGRATE_URL` misconfigured — note migrations use
  `DB_MIGRATE_URL` (the **direct**, non-pooled Neon DSN) because Neon's PgBouncer
  pooler is incompatible with Laravel's migration advisory locks.
- Render free tier spun down — the service sleeps after ~15 min of inactivity;
  the first request afterwards takes up to ~50s to wake.

**Fix:** correct the env var in the Render dashboard, then **Manual Deploy →
Deploy latest commit**. The entrypoint re-runs migrations and reference seeding on
every boot, so a redeploy is the shell-free equivalent of running them by hand.

---

## Symptom: Login returns 401 or "Invalid credentials"

**Check:**
1. Verify the user exists — Neon SQL Editor:
   ```sql
   SELECT id, email, is_admin, created_at FROM "user" WHERE email = 'user@example.com';
   ```
2. Verify `CORS_ALLOWED_ORIGINS` includes the frontend URL (otherwise the browser
   blocks the response before it reaches JS). There is no production fallback, so
   an unset value allows nothing.

**Note:** a 401 on a request that previously worked is expected in two cases —
tokens now expire (`SANCTUM_TOKEN_EXPIRATION`, default 7 days), and every token is
revoked when the user changes or resets their password. The frontend handles this
by clearing the token and redirecting to `/login`.

**Fix — password reset for a specific user.** Prefer the in-app
"forgot password" flow (this requires the `MAIL_*` vars to be set, or no OTP is
actually delivered). If you must intervene directly, generate a bcrypt hash
locally and set it via the Neon SQL Editor:
```bash
# locally, in the backend directory
php -r 'echo password_hash("newpassword", PASSWORD_BCRYPT, ["cost" => 12]), PHP_EOL;'
```
```sql
UPDATE "user" SET password = '<paste the $2y$... hash>' WHERE email = 'user@example.com';
-- force re-login everywhere
DELETE FROM personal_access_tokens WHERE tokenable_id = (SELECT id FROM "user" WHERE email = 'user@example.com');
```

---

## Symptom: CORS error in browser

**Symptoms:** Browser console shows `Access-Control-Allow-Origin` errors.

**Check:**
1. Render env var `CORS_ALLOWED_ORIGINS` — must include the exact Vercel URL (no
   trailing slash). It has **no default**: unset means no origin is allowed.

**Fix:** Update the env var in the Render dashboard → redeploy (the value is read
into the cached config at boot).

> In normal operation the browser never makes a cross-origin request: the frontend
> calls same-origin `/api/*` paths which the Next.js rewrite proxies. A CORS error
> usually means something is calling the Render URL directly — check for an
> absolute URL that has crept into `src/lib/api.ts`, which must keep
> `BASE_URL = ''`.

---

## Symptom: Database migrations fail on deploy

The container now **exits non-zero** after 10 failed attempts instead of serving
traffic, so the symptom is a service that restarts repeatedly and never becomes
healthy. This is deliberate: it prevents Render's health gate from green-lighting a
deploy with an un-migrated schema.

**Check Render Logs for:**
```
Migration attempt N/10 failed; retrying in 3s...
FATAL: migrations did not succeed after 10 attempts — refusing to start.
SQLSTATE[...] — column already exists
SQLSTATE[...] — relation "..." does not exist
```

**Fix — inspect state via the Neon SQL Editor:**
```sql
-- which migrations have run
SELECT migration, batch FROM migrations ORDER BY id DESC LIMIT 15;
```

Then, depending on the cause:

- **"column already exists"** — the migration is not idempotent. Guard it with
  `Schema::hasColumn()` (see `2026_06_09_120000_re_add_user_id_to_category_table.php`
  for the established pattern), push the fix, and redeploy. As a stopgap you can
  insert the migration name into the `migrations` table to mark it as applied:
  ```sql
  INSERT INTO migrations (migration, batch)
  VALUES ('2026_xx_xx_xxxxxx_the_migration_name', (SELECT COALESCE(MAX(batch),0)+1 FROM migrations));
  ```
- **"relation does not exist"** — a migration ran out of order or a prior one
  silently no-opped. Verify with `\d` equivalents in the Neon editor
  (`SELECT * FROM information_schema.columns WHERE table_name = 'expense';`).
- **Needs a rollback** — there is no shell, so revert the migration in code and
  push a new forward migration that undoes the change. Never leave production
  needing a manual `migrate:rollback`.

**Prevention:** migrations must be idempotent and must not use `->after()`, which
Postgres silently ignores. See the schema note in `CLAUDE.md`.

---

## Symptom: Expenses not saving / 422 Unprocessable Entity

**Check:** The request body. Required fields for `POST /api/expenses`:
- `category_id` (integer) — must be a global category or one the user owns
- `amount` (numeric, `0.01`–`99999999.99`)
- `spent_at` (date string, **not in the future**)
- `description` (optional, max 255 chars)
- `payment_method_id` (optional, must exist)

A 422 here is usually correct behaviour rather than a fault. The bounds on
`amount` and `spent_at` exist because values outside them previously reached
Postgres and failed as a 500.

**Check the reference data is seeded** — Neon SQL Editor:
```sql
-- global categories (user_id IS NULL) should be 6; total will be higher
-- because users own their own categories
SELECT COUNT(*) FROM category WHERE user_id IS NULL;
SELECT COUNT(*) FROM payment_method;   -- should be 6
```

If either is 0, **redeploy**: the entrypoint runs `CategorySeeder` and
`PaymentMethodSeeder` on every boot and both are idempotent.

---

## Render Free Tier Cold Start

Render free tier services sleep after ~15 minutes of inactivity. The first request
after sleep takes up to ~50 seconds.

Workaround: Set up an external uptime monitor (e.g., UptimeRobot) to ping
`/api/health` every 14 minutes. This is not codified anywhere in the repo — it
must be configured in the monitoring provider. See `MONITORING.md`.

---

## Emergency: Revoke All User Tokens

Neon SQL Editor:
```sql
DELETE FROM personal_access_tokens;
```

This logs out all users immediately. Note that tokens also expire on their own
(`SANCTUM_TOKEN_EXPIRATION`, default 7 days) and are revoked automatically when a
user changes or resets their password.

---

## Logs

**Backend (Render):**
Render Dashboard → Service → Logs (real-time streaming available)

**Frontend (Vercel):**
Vercel Dashboard → Project → Functions (for SSR errors) or browser DevTools

**Database (Neon):**
Neon Dashboard → Project → Monitoring → Query History
