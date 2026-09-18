# Production Deployment Setup

## Current Production Stack

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://trakspend.vercel.app |
| Backend API | Render | https://expense-tracker-singapore.onrender.com |
| Database | Neon (PostgreSQL 15) | Internal DSN |

---

## Backend — Render

### Service type
Web Service → Docker (uses `backend/Dockerfile`)

### Required environment variables

Set these in the Render dashboard under **Environment → Environment Variables**:

```dotenv
APP_ENV=production
APP_KEY=<generate with: php artisan key:generate --show>
APP_DEBUG=false
APP_URL=https://expense-tracker-singapore.onrender.com

# Database (copy from Neon dashboard)
DB_CONNECTION=pgsql
DATABASE_URL=<full DSN from Neon, e.g. postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require>
DB_SSLMODE=require

# CORS / Sanctum — set to your Vercel frontend URL
CORS_ALLOWED_ORIGINS=https://trakspend.vercel.app
SANCTUM_STATEFUL_DOMAINS=trakspend.vercel.app

# Seeding — MUST be false in production
SEED_TEST_USER=false

SESSION_DRIVER=cookie
SESSION_SECURE_COOKIE=true
LOG_LEVEL=error
```

### Build & start

Render uses the `backend/Dockerfile` automatically. The `docker-entrypoint.sh` runs:
1. `php artisan migrate --force`
2. `php artisan db:seed --force` (only if `SEED_TEST_USER=true`)
3. PHP-FPM + Nginx

### Health check

Configure Render health check path: `/api/health`

Expected response: `{"status":"ok"}` with HTTP 200.

---

## Database — Neon

### Provisioning

1. Create a project at https://neon.tech
2. Copy the connection string from the dashboard (format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
3. Set `DATABASE_URL` on the Render backend service
4. Migrations run automatically on deploy via the entrypoint script

### SSL

Neon requires `sslmode=require`. Ensure `DB_SSLMODE=require` or use the full `DATABASE_URL` DSN which includes `?sslmode=require`.

---

## Frontend — Vercel

### Deployment

Vercel auto-deploys from the `main` branch. No Dockerfile is used — Vercel's Next.js build pipeline handles it.

### Required environment variables

Set in Vercel dashboard → Project → Settings → Environment Variables, for
**both Production and Preview**:

```dotenv
BACKEND_URL=https://expense-tracker-singapore.onrender.com
```

`next.config.ts` bakes this into the `/api/*` rewrite at **build** time and
**fails the build outright** if it is missing — there is deliberately no
production fallback, so that a local `npm run dev` cannot silently proxy to the
live backend. Preview deployments are production builds too, so a value scoped
only to Production makes every pull-request build fail. After changing it,
trigger a redeploy; a running deployment will not pick up the new value.

> `NEXT_PUBLIC_API_URL` was the old variable and is dead — nothing in `src/`
> reads it (`api.ts` uses relative URLs and lets the rewrite do the routing).
> It can be removed from the Vercel project.

### Domain

The project is served at `trakspend.vercel.app`. The backend CORS and Sanctum configs must include this exact origin.

---

## Deployment Checklist

- [ ] `APP_DEBUG=false` on Render
- [ ] `SEED_TEST_USER=false` on Render
- [ ] `SESSION_SECURE_COOKIE=true` on Render
- [ ] `LOG_LEVEL=error` on Render
- [ ] `CORS_ALLOWED_ORIGINS` matches Vercel URL exactly
- [ ] `DATABASE_URL` DSN includes `?sslmode=require`
- [ ] `BACKEND_URL` set in Vercel environment, for **both** Production and Preview
- [ ] Render health check path set to `/api/health`
- [ ] No `test@example.com` account exists in production DB

---

## Updating a Deployment

**Backend change:**
```
git push origin main   # Render auto-deploys on push to main
```

**Frontend change:**
```
git push origin main   # Vercel auto-deploys on push to main
```

**Database migration (no downtime for additive migrations):**
Migrations run automatically during backend deploy via the entrypoint script.
