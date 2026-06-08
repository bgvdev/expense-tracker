# Deployment Guide

## Architecture Overview

```
trakspend.vercel.app (Vercel)
    └─ Next.js 15 SPA
         │ HTTPS + Bearer token
         ▼
expense-tracker-funw.onrender.com (Render)
    └─ Nginx → PHP-FPM → Laravel 11
         │ pgsql+ssl
         ▼
Neon PostgreSQL 15
```

---

## Backend — Render

### Initial Setup

1. **Create a new Web Service** on Render and connect your GitHub repo.
2. Set **Root Directory** to `backend` (or leave empty — Render auto-detects the `Dockerfile`).
3. Set **Dockerfile path** to `backend/Dockerfile`.
4. Set the **Health Check Path** to `/api/health`.

### Environment Variables

Add all variables listed in [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) under the "Production" column.

Key values to get right:
- `APP_KEY` — run `php artisan key:generate --show` locally and paste the output.
- `DATABASE_URL` — copy the full connection string from Neon (includes SSL parameters).
- `CORS_ALLOWED_ORIGINS` — must exactly match your Vercel frontend URL.
- `SEED_TEST_USER=false` — never seed test credentials in production.

### Deploy Flow

Every push to `main` triggers:
1. Render pulls the latest code.
2. Docker image is built from `backend/Dockerfile`.
3. Container starts via `docker-entrypoint.sh`:
   - `php artisan migrate --force` (runs new migrations)
   - `db:seed` (skipped — `SEED_TEST_USER=false`)
   - PHP-FPM + Nginx starts

### Rollback

Use the Render dashboard → **Deploys** tab → click any previous deploy → **Redeploy**.

---

## Database — Neon

### Initial Setup

1. Sign in at https://neon.tech and create a project.
2. Copy the connection string from the dashboard.
3. Set `DATABASE_URL` in Render environment variables.

### Migrations

Migrations run automatically on every deploy. They are idempotent — re-running is safe.

To run manually:
```bash
# Via Render Shell (dashboard → Shell tab)
php artisan migrate --status
php artisan migrate --force
```

### Backups

Neon provides point-in-time restore (PITR) on paid plans. On the free plan, take manual snapshots before schema-breaking changes:

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

## Frontend — Vercel

### Initial Setup

1. Import the repo in the Vercel dashboard.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Next.js — no build command override needed.
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://expense-tracker-funw.onrender.com`.

### Deploy Flow

Every push to `main` triggers:
1. Vercel runs `npm run build` inside `frontend/`.
2. `NEXT_PUBLIC_API_URL` is baked into the static bundle.
3. The new build is promoted to production.

### Rollback

Vercel dashboard → **Deployments** → any previous deployment → **Promote to Production**.

---

## CI/CD Notes

There is no CI pipeline currently. Recommended additions:

1. **GitHub Actions** — run `php artisan test` on pull requests.
2. **Vercel Preview Deployments** — each PR gets a preview URL automatically.
3. **Branch protection** — require passing CI before merge to `main`.

---

## Changing the Backend URL

If you migrate away from Render:

1. Update `NEXT_PUBLIC_API_URL` in Vercel environment variables → redeploy frontend.
2. Update `APP_URL` in the new backend environment.
3. Update `CORS_ALLOWED_ORIGINS` on the new backend to include the Vercel URL.
4. Update `README.md` with the new URLs.
5. Update the fallback in `frontend/src/lib/api.ts:1`.

## Changing the Frontend URL

If you change the Vercel domain:

1. Update `CORS_ALLOWED_ORIGINS` on Render → backend redeploys.
2. Update `SANCTUM_STATEFUL_DOMAINS` on Render.
3. Update `README.md`.
