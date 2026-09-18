# Monitoring

## Health Checks

### Backend health endpoint

```
GET https://expense-tracker-singapore.onrender.com/api/health
```

Expected response:
```json
{"status": "ok", "database": "ok"}
```

HTTP status: `200 OK`

When the database is unreachable it returns `503 Service Unavailable`:
```json
{"status": "error", "database": "unavailable"}
```

Use this URL in any uptime monitor. It verifies Nginx, PHP-FPM, the Laravel
router **and** the database connection (via a `select 1`). This matters because
Render gates deploys on this endpoint: a static 200 could not distinguish a
healthy deploy from one whose migrations had failed.

### Database connectivity check

`/api/health` already covers this. The endpoint is the check — there is no need
for a Render Shell session (which is unavailable on the free plan anyway).

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
2. Add HTTP monitor: `https://expense-tracker-singapore.onrender.com/api/health`
3. Set interval: 5 minutes
4. Add alert email: `gohelbhargav442@gmail.com`

This has the side effect of keeping the service warm.

---

## Error Monitoring — Sentry (implemented on both runtimes)

Sentry is already installed and wired. There is nothing to install; only the DSNs
need to be set. Both runtimes are **inert when their DSN is empty**, so local dev
stays quiet.

**Backend** — `sentry/sentry-laravel`, registered via `Integration::handles()` in
`backend/bootstrap/app.php`, configured by `backend/config/sentry.php`:

```dotenv
SENTRY_LARAVEL_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.2
```

Set in the Render dashboard (declared in `render.yaml` with `sync: false`).

**Frontend** — `@sentry/nextjs`, wrapped by `withSentryConfig` in
`frontend/next.config.ts`, with `sentry.server.config.ts`,
`sentry.edge.config.ts`, `src/instrumentation.ts` and
`src/instrumentation-client.ts`:

```dotenv
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

Set in Vercel project settings. Source-map upload runs only when
`SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are all present, so builds
without them still succeed (maps upload skipped).

> Only the post-deploy Sentry *release-tagging* step was removed. Runtime error
> reporting is live.

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
