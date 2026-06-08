# Monitoring

## Health Checks

### Backend health endpoint

```
GET https://expense-tracker-funw.onrender.com/api/health
```

Expected response:
```json
{"status": "ok"}
```

HTTP status: `200 OK`

Use this URL in any uptime monitor. It checks that Nginx, PHP-FPM, and the Laravel router are all alive. It does **not** check the database connection.

### Database connectivity check

```bash
# Via Render Shell
php artisan db:show
```

Or add a DB-checking endpoint (not currently implemented):
```
GET /api/health/db   → checks DB connection + query latency
```

---

## Logs

### Backend — Render

**Real-time:**
Render Dashboard → Service → Logs

**Log levels:**
- `LOG_LEVEL=error` in production — only errors are written
- `LOG_LEVEL=debug` in local — full request lifecycle

**Log format:** Laravel's default stack channel (single file + stderr for containers).

**Log location inside container:** `storage/logs/laravel.log` (also visible in Render's log stream).

### Frontend — Vercel

- Client-side errors: Browser DevTools → Console
- Build errors: Vercel Dashboard → Project → Deployments → Build Logs
- Server-side errors (if any SSR is added): Vercel Dashboard → Functions

---

## Key Metrics to Watch

| Metric | Tool | Threshold |
|--------|------|-----------|
| API response time | Render metrics | > 2s = investigate |
| Error rate (5xx) | Render logs | Any spike = investigate |
| DB query count | Neon monitoring | Unexpected spikes |
| Frontend build time | Vercel | > 5 min = investigate |
| Uptime | External monitor | < 99.5% = investigate |

---

## Recommended Uptime Monitor Setup

Since the Render free tier sleeps after inactivity, set up a monitor that pings every ~14 minutes:

**UptimeRobot (free):**
1. Create account at https://uptimerobot.com
2. Add HTTP monitor: `https://expense-tracker-funw.onrender.com/api/health`
3. Set interval: 5 minutes
4. Add alert email: `gohelbhargav442@gmail.com`

This has the side effect of keeping the service warm.

---

## Error Monitoring (Not Yet Implemented)

Consider adding Sentry for production error tracking:

**Backend:**
```bash
composer require sentry/sentry-laravel
```

```dotenv
SENTRY_LARAVEL_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Frontend:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```dotenv
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Database Monitoring — Neon

Neon Console provides:
- Query count and latency
- Compute unit hours used
- Connection count
- Slow query log

Access: Neon Console → Project → Monitoring

---

## Alerts Checklist

- [ ] Uptime monitor on `/api/health` with email alert
- [ ] Render email notifications enabled (Deploy failures, service crashes)
- [ ] Vercel email notifications enabled (Build failures)
- [ ] Neon usage alerts set (approaching free tier limits)
