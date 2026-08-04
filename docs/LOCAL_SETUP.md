# Local Development Setup

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24+ | Full-stack local environment |
| Docker Compose | v2+ | Orchestrates db, api, web containers |
| PHP | 8.3+ | Backend standalone (optional) |
| Composer | 2+ | PHP dependency manager |
| Node.js | 20+ | Frontend standalone (optional) |
| npm | 10+ | JS dependency manager |

The Docker path is recommended — it requires nothing except Docker.

---

## Option A: Full Stack with Docker (Recommended)

### 1. Clone and enter the repo

```bash
git clone <your-repo-url> expense-tracker
cd expense-tracker
```

### 2. Create the root env file

**Docker Compose reads the repo-root `.env` and only that file** — it does not
read `backend/.env` when interpolating `docker-compose.yml`. This is the single
most common first-run mistake.

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```dotenv
APP_KEY=               # generated in step 3
DB_PASSWORD=changeme   # any password you choose
SEED_TEST_USER=true    # creates test@example.com/password on first run
```

Under Docker you do **not** need `backend/.env` at all: the `api` service gets
its configuration from the `environment:` block in `docker-compose.yml`.
`backend/.env` is only for running the backend standalone (Option B).

### 3. Generate the application key

```bash
docker compose run --rm api php artisan key:generate --show
```

Copy the printed `base64:…` value into `APP_KEY` in the root `.env`. Outside
`APP_ENV=local` the container now refuses to boot without it, rather than
generating a throwaway key on every restart.

### 4. Start all services

```bash
docker compose up --build   # first run (builds images, runs migrations, seeds db)
docker compose up           # subsequent runs
```

### 5. Verify everything is running

Host ports are deliberately **off the defaults** so the stack can coexist with
other projects. Override them with `WEB_HOST_PORT`, `API_HOST_PORT` and
`DB_HOST_PORT` in the root `.env`.

| URL | Expected |
|-----|----------|
| http://localhost:13000 | Next.js login page |
| http://localhost:18000/api/health | `{"status":"ok","database":"ok"}` |
| `localhost:15432` | PostgreSQL (via psql or a GUI client) |

The health endpoint verifies the database, so a `503` with
`{"database":"unavailable"}` means the API is up but cannot reach Postgres.

### Default test credentials (local only)

```
Email:    test@example.com
Password: password
```

### Stop the stack

```bash
docker compose down          # stops containers, preserves volumes
docker compose down -v       # stops and deletes all data (full reset)
```

---

## Option B: Backend Standalone

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Edit .env — set DB_* to point to your local Postgres instance
php artisan migrate
php artisan db:seed   # requires SEED_TEST_USER=true in .env

php artisan serve     # http://localhost:8000
```

---

## Option C: Frontend Standalone

```bash
cd frontend
npm install
cp .env.example .env.local
# Set BACKEND_URL=http://localhost:8000 — the proxy target for the /api/* rewrite
npm run dev           # http://localhost:3000
```

`BACKEND_URL` is the variable that matters: `src/lib/api.ts` only ever issues
relative `/api/*` requests, which the Next.js rewrite proxies. It is read at
**build** time, so a runtime-only value has no effect on a built image.
`NEXT_PUBLIC_API_URL` is not read by any application code.

---

## Troubleshooting

**`DB_PASSWORD must be set in .env`** — set it in the **repo-root** `.env`, not `backend/.env`. Compose only interpolates from the root file.

**`FATAL: APP_KEY is not set`** — set `APP_KEY` in the root `.env` (step 3). The container fails fast instead of generating a new key each boot, which would invalidate encrypted payloads on every restart.

**Port already in use** — Check for conflicting processes: `lsof -i :18000` or `lsof -i :13000`. Or change `API_HOST_PORT` / `WEB_HOST_PORT` in the root `.env`.

**`api` container exits immediately / restarts in a loop** — migrations failed. The entrypoint retries 10 times and then exits non-zero rather than serving traffic against an un-migrated schema. Run `docker compose logs api` for the migration error and `docker compose logs db` to check the database.

**Frontend shows "Is the API running?"** — Confirm `BACKEND_URL` reaches the API and that `api` is up (`docker compose ps`, then `curl localhost:18000/api/health`).

**`EACCES` running `npm run lint` / `npm run build` on the host** — `frontend/node_modules` and `.next` are created by the container as root. Either run the commands inside the container (`docker compose exec web npm run lint`) or reclaim ownership: `sudo chown -R "$USER" frontend/node_modules frontend/.next`.
