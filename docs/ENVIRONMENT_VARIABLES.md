# Environment Variables Reference

## Backend (`backend/.env`)

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | No | `Expense Tracker` | Display name used in emails and logs |
| `APP_ENV` | Yes | `local` | Runtime environment: `local`, `staging`, `production` |
| `APP_KEY` | Yes | — | 32-byte AES-256 key. Run `php artisan key:generate` |
| `APP_DEBUG` | Yes | `false` | Set `true` only in local/staging. Exposes stack traces |
| `APP_URL` | Yes | `http://localhost:8000` | Full URL of the backend (used in console-generated URLs) |

### Frontend / CORS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | **Yes** | — (empty) | Comma-separated list of allowed frontend origins. **No default** — if unset, no cross-origin request is allowed. Must include the Vercel URL in production |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Used for links in welcome / password-reset emails. Set to the Vercel URL in production |

> `SANCTUM_STATEFUL_DOMAINS` and the `SESSION_*` family were removed: this is a
> stateless Bearer-token API with no cookies and no CSRF, so they were dead
> configuration.

### Auth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SANCTUM_TOKEN_EXPIRATION` | No | `10080` (7 days) | Token lifetime in minutes. Must stay finite — tokens are held in the browser's `localStorage` |
| `API_RATE_LIMIT` | No | `120` | Requests per minute on every `/api` route, keyed by authenticated user (falling back to IP) |
| `BCRYPT_ROUNDS` | No | `12` | Password hashing cost |

### Cache

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CACHE_STORE` | No | `file` | Cache driver. **Deliberately not the framework default of `database`**: every `/api` route passes through the `throttle:api` limiter, which reads and writes the cache store, and on the `database` driver each request therefore paid two extra round trips to Postgres before reaching the handler. `file` keeps them inside the container. Only correct while there is a single web instance — a multi-instance deploy needs `redis`, otherwise each instance grants its own rate-limit budget |

### Mail

Required in any environment that must actually send email. Without them
`config/mail.php` falls back to the `log` driver, so password-reset OTPs and
welcome emails are silently written to the log instead of being delivered.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIL_MAILER` | Yes | `log` | Use `smtp` to send for real |
| `MAIL_HOST` | Yes | — | e.g. `smtp.gmail.com` |
| `MAIL_PORT` | Yes | — | e.g. `587` |
| `MAIL_ENCRYPTION` | No | `tls` | |
| `MAIL_USERNAME` | Yes | — | Sending account |
| `MAIL_PASSWORD` | Yes | — | Gmail **App Password**, never a login password |
| `MAIL_FROM_ADDRESS` | Yes | — | Usually the same as `MAIL_USERNAME` |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_CONNECTION` | Yes | `pgsql` | Database driver. Always `pgsql` for this project |
| `DB_HOST` | Yes | `db` | Hostname. `db` in Docker Compose; cloud hostname in production |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_DATABASE` | Yes | `expense_tracker` | Database name |
| `DB_USERNAME` | Yes | `laravel` | Database user |
| `DB_PASSWORD` | **Yes** | — | Database password. No fallback — must be explicitly set |
| `DB_SSLMODE` | No | `prefer` | SSL mode. Use `require` for Neon and other cloud providers |
| `DATABASE_URL` | No | — | Optional full DSN (overrides individual DB_* vars in the pgsql driver) |
| `DB_MIGRATE_URL` | No | falls back to `DATABASE_URL` | **Direct (non-pooled)** Neon DSN, used only for migrations. Neon's PgBouncer pooler is incompatible with the session-level advisory locks Laravel takes during migration. Same as `DATABASE_URL` without `-pooler` in the hostname |

### Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_CHANNEL` | No | `stack` | Laravel log channel |
| `LOG_LEVEL` | No | `debug` | Minimum log level. Use `error` in production to reduce noise |

### Seeding

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SEED_TEST_USER` | No | `false` | Set `true` to create `test@example.com` / `password` on seeder run. **Never enable in production** |

---

## Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | **Yes** | `http://localhost:8000` in dev; **none** in production | Proxy target for the `/api/*` rewrite in `next.config.ts`. This is the only variable that affects where API calls go |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Empty disables error reporting |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | No | — | Build-time source-map upload only |

`BACKEND_URL` is read at **build** time and baked into the build output, so it
must be supplied as a Vercel env var or Docker `--build-arg`; a runtime-only
value has no effect. A production build **fails** if it is unset, rather than
silently proxying to the production backend.

`src/lib/api.ts` deliberately uses `BASE_URL = ''` so the browser only ever
issues same-origin `/api/*` requests, which avoids CORS entirely. Do not
introduce absolute URLs there — change the proxy destination instead.

> `NEXT_PUBLIC_API_URL` still appears in `.env.example` and `docker-compose.yml`
> but is **read by no application code**. `NEXT_PUBLIC_*` variables are exposed
> to the browser; never put secrets in them.

---

## Docker Compose (**repo-root `.env`** or shell environment)

Compose interpolates `${VAR}` in `docker-compose.yml` from the **root** `.env`
only — it does not read `backend/.env`. Start from `cp .env.example .env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_KEY` | — | Passed into `api`. Required: the container refuses to boot without it outside `APP_ENV=local` |
| `APP_ENV` | `local` | Passed into `api`. Also gates config/route caching |
| `APP_DEBUG` | `false` | Passed into `api` |
| `DB_DATABASE` | `expense_tracker` | Used by both `db` and `api` |
| `DB_USERNAME` | `laravel` | Used by both `db` and `api` |
| `DB_PASSWORD` | **required** | Used by both `db` and `api` — no fallback; compose fails fast |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:13000` | Passed into `api`. Must match the browser origin, i.e. `WEB_HOST_PORT` |
| `SEED_TEST_USER` | `true` | Passed into `api` — enables the test-user seed in Docker dev |

### Host port mappings

Deliberately off the defaults so the stack can run alongside other projects.
Container-internal ports are unaffected, so `db:5432` and `api:8000` still work
between services.

| Variable | Default | Maps to |
|----------|---------|---------|
| `WEB_HOST_PORT` | `13000` | `web` container `:3000` |
| `API_HOST_PORT` | `18000` | `api` container `:8000` |
| `DB_HOST_PORT` | `15432` | `db` container `:5432` |

---

## Environment Matrix

| Variable | Local (Docker) | Staging | Production |
|----------|----------------|---------|------------|
| `APP_ENV` | `local` | `staging` | `production` |
| `APP_DEBUG` | `true` | `false` | `false` |
| `APP_KEY` | from `.env` | secret manager | secret manager |
| `DB_PASSWORD` | any strong value | secret manager | secret manager |
| `DB_SSLMODE` | `prefer` | `require` | `require` |
| `LOG_LEVEL` | `debug` | `info` | `error` |
| `SEED_TEST_USER` | `true` | `true` | **`false`** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:13000` | staging URL | `https://trakspend.vercel.app` |
| `MAIL_MAILER` | `log` (unset) | `smtp` | `smtp` |
| `BACKEND_URL` (frontend) | `http://localhost:8000` | staging API | Render API URL |
