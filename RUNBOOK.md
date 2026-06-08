# Runbook — Production Troubleshooting

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
- `NEXT_PUBLIC_API_URL` is wrong or missing in Vercel env vars — the frontend will use the hardcoded fallback, which may be stale.
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
1. `curl https://expense-tracker-funw.onrender.com/api/health`
2. Render dashboard → Service → Logs — look for PHP errors or migration failures.

**Common causes:**
- `APP_KEY` missing or changed — Laravel can't decrypt session data or signed URLs.
- `DATABASE_URL` or `DB_*` misconfigured — migrations or queries fail.
- Render free tier spun down — the service sleeps after inactivity; first request takes ~30s to wake.

**Fix:**
```bash
# Check API key via Render Shell
php artisan key:show

# Check DB connectivity
php artisan db:show

# Re-run migrations if they failed
php artisan migrate --force
```

---

## Symptom: Login returns 401 or "Invalid credentials"

**Check:**
1. Verify the user exists: Render Shell → `php artisan tinker` → `App\Models\User::where('email','user@example.com')->first()`
2. Verify `CORS_ALLOWED_ORIGINS` includes the frontend URL (otherwise the browser blocks the response before it reaches JS).

**Fix:**
```php
// Reset password via tinker
$user = App\Models\User::where('email','user@example.com')->first();
$user->password = bcrypt('newpassword');
$user->save();
```

---

## Symptom: CORS error in browser

**Symptoms:** Browser console shows `Access-Control-Allow-Origin` errors.

**Check:**
1. Render env var `CORS_ALLOWED_ORIGINS` — must include the exact Vercel URL (no trailing slash).
2. Render env var `SANCTUM_STATEFUL_DOMAINS` — must include the Vercel domain (no `https://`).

**Fix:** Update env vars in Render dashboard → redeploy.

---

## Symptom: Database migrations fail on deploy

**Check Render Logs for:**
```
SQLSTATE[...] — column already exists
SQLSTATE[...] — relation "..." does not exist
```

**Fix:**
```bash
# Via Render Shell
php artisan migrate:status
php artisan migrate --force

# If a migration is broken and needs to be rolled back
php artisan migrate:rollback --step=1
```

---

## Symptom: Expenses not saving / 422 Unprocessable Entity

**Check:** The request body. Required fields for `POST /api/expenses`:
- `category_id` (integer)
- `amount` (numeric, > 0)
- `spent_at` (date string)

**Check categories are seeded:**
```bash
# Via Render Shell
php artisan tinker
App\Models\Category::count();   # should be 6
```

If 0, run:
```bash
php artisan db:seed --class=CategorySeeder
```

---

## Render Free Tier Cold Start

Render free tier services sleep after 15 minutes of inactivity. The first request after sleep takes up to 30 seconds.

Workaround: Set up an external uptime monitor (e.g., UptimeRobot) to ping `/api/health` every 14 minutes.

---

## Emergency: Revoke All User Tokens

```bash
# Via Render Shell
php artisan tinker
Laravel\Sanctum\PersonalAccessToken::truncate();
```

This logs out all users immediately.

---

## Logs

**Backend (Render):**
Render Dashboard → Service → Logs (real-time streaming available)

**Frontend (Vercel):**
Vercel Dashboard → Project → Functions (for SSR errors) or browser DevTools

**Database (Neon):**
Neon Dashboard → Project → Monitoring → Query History
