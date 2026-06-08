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
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:3000` | Comma-separated list of allowed frontend origins. Must include the Vercel URL in production |
| `SANCTUM_STATEFUL_DOMAINS` | Yes | `localhost,127.0.0.1` | Comma-separated hostnames (no scheme) that receive Sanctum session cookies |

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

### Session

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_DRIVER` | No | `cookie` | Session storage. `cookie` is lightweight for this stateless API |
| `SESSION_LIFETIME` | No | `120` | Session idle timeout in minutes |
| `SESSION_SECURE_COOKIE` | No | `false` | Must be `true` in production (requires HTTPS) |

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
| `NEXT_PUBLIC_API_URL` | Yes | `https://expense-tracker-funw.onrender.com` (fallback in code) | Backend API base URL (no trailing slash). Baked into the client bundle at build time |

> **Note:** `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets in them.

---

## Docker Compose (root `.env` or shell environment)

These variables are read by `docker-compose.yml` at startup:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_KEY` | — | Passed into the `api` container |
| `APP_ENV` | `local` | Passed into the `api` container |
| `APP_DEBUG` | `false` | Passed into the `api` container |
| `DB_DATABASE` | `expense_tracker` | Used by both `db` and `api` services |
| `DB_USERNAME` | `laravel` | Used by both `db` and `api` services |
| `DB_PASSWORD` | **required** | Used by both `db` and `api` services — no fallback |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Passed into `api` |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost,127.0.0.1` | Passed into `api` |
| `SEED_TEST_USER` | `true` | Passed into `api` — enables test user seed in Docker dev |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Passed into `web` container |

---

## Environment Matrix

| Variable | Local (Docker) | Staging | Production |
|----------|----------------|---------|------------|
| `APP_ENV` | `local` | `staging` | `production` |
| `APP_DEBUG` | `true` | `false` | `false` |
| `APP_KEY` | from `.env` | secret manager | secret manager |
| `DB_PASSWORD` | any strong value | secret manager | secret manager |
| `DB_SSLMODE` | `prefer` | `require` | `require` |
| `SESSION_SECURE_COOKIE` | `false` | `true` | `true` |
| `LOG_LEVEL` | `debug` | `info` | `error` |
| `SEED_TEST_USER` | `true` | `true` | **`false`** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | staging URL | `https://trakspend.vercel.app` |
