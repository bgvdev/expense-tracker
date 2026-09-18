# Docker Guide

## Services

```
docker-compose.yml            host port  →  container port
├── db      postgres:15-alpine     15432  →  5432
├── api     backend/Dockerfile     18000  →  8000  (Nginx + PHP-FPM)
└── web     node:20-alpine         13000  →  3000  (Next.js dev server)
```

Host ports are deliberately off the defaults (5432/8000/3000) so this stack can
run alongside other projects. Override them in the repo-root `.env` with
`DB_HOST_PORT`, `API_HOST_PORT` and `WEB_HOST_PORT`. Container-internal ports
never change, so inter-service URLs (`db:5432`, `api:8000`) are unaffected.

---

## Container Details

### `db` — PostgreSQL 15

- Image: `postgres:15-alpine`
- Persistent volume: `db_data` mounted at `/var/lib/postgresql/data`
- Credentials come from `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in the repo-root `.env`
- Exposed to the host on `localhost:15432` (`DB_HOST_PORT`) for psql/pgAdmin/TablePlus
- Has a healthcheck — the `api` service waits for it before starting

### `api` — Laravel Backend

- Built from `backend/Dockerfile`
- PHP 8.3-FPM + Nginx in a single container (processes managed by the entrypoint script)
- Bind-mount: `./backend` → `/var/www/html` (live code reload in dev)
- Named volume: `backend_vendor` — preserves `vendor/` across host-side edits
- Runs as **`www-data`**, not root (verify with `docker compose exec api whoami`)
- Startup sequence (via `docker-entrypoint.sh`):
  1. Fix storage/cache directory permissions
  2. Require `APP_KEY` — generated only when `APP_ENV=local`, otherwise fatal
  3. Retry `php artisan migrate --force` up to 10 times (waits for db), then
     **exit non-zero** if it never succeeds — the container refuses to serve
     traffic against an un-migrated schema
  4. Seed reference data on every boot: `CategorySeeder` **and**
     `PaymentMethodSeeder` (both idempotent)
  5. Run the full `php artisan db:seed --force` only if `SEED_TEST_USER=true`
     (adds the `test@example.com` fixture)
  6. Cache config + routes, unless `APP_ENV=local` (where they are cleared
     instead, since the source is bind-mounted). This must happen at runtime, not
     build time — caching at build would freeze empty env values into the cache.
  7. Start PHP-FPM in background
  8. Start Nginx in foreground (PID 1)
- Nginx listens on port 8000 and proxies `.php` requests to PHP-FPM on `127.0.0.1:9000`

> Note: the entrypoint is baked into the image at `/usr/local/bin/`, so it is
> **not** picked up from the bind mount. Editing `backend/docker-entrypoint.sh`
> requires `docker compose build api` to take effect.

### `web` — Next.js Frontend

- Image: `node:20-alpine` (does not use `frontend/Dockerfile`)
- Bind-mount: `./frontend` → `/app` (live code reload)
- Named volume: `frontend_node_modules` — **masks** the host's `node_modules/`, so
  dependencies live only inside the container. You do not need to run
  `npm install` on the host for Docker to work.
- Runs `npm install` then `npm run dev`
- `WATCHPACK_POLLING=true` enables file watching inside Docker on systems where inotify doesn't work across mounts
- `BACKEND_URL=http://api:8000` targets the API over the compose network

> Because the container creates `frontend/node_modules` and `frontend/.next` as
> root, host-side `npm run lint` / `npm run build` can fail with `EACCES`. Run
> them in the container (`docker compose exec web npm run lint`) or
> `sudo chown -R "$USER" frontend/node_modules frontend/.next`.

---

## Volumes

| Volume | Used By | Purpose |
|--------|---------|---------|
| `db_data` | `db` | Postgres data files — persists database across restarts |
| `backend_vendor` | `api` | PHP `vendor/` directory — avoids re-running `composer install` on code changes |
| `frontend_node_modules` | `web` | `node_modules/` — avoids re-running `npm install` on code changes |

---

## Networks

All three services share `expense_net` (bridge driver). Service names are DNS-resolvable within the network:
- `api` container connects to the database at host `db:5432`
- `web` container calls the API at `http://api:8000`; from the host it is `http://localhost:18000`

---

## Common Commands

```bash
# Start all services (first run — builds images)
docker compose up --build

# Start all services (subsequent runs)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f api

# Open a shell in a container
docker compose exec api bash
docker compose exec web sh

# Run artisan commands
docker compose exec api php artisan migrate:status
docker compose exec api php artisan tinker

# Run the backend gates (pint / phpunit).
# The image is built with `composer install --no-dev`, so the dev tools are not
# present until you install them once into the backend_vendor volume:
docker compose exec api composer install
docker compose exec api php artisan package:discover   # registers the dev packages
docker compose exec api ./vendor/bin/pint --test
docker compose exec api php artisan test

# Run npm commands / the frontend gates
docker compose exec web npm install <package>
docker compose exec web npm run lint
docker compose exec web npx tsc --noEmit

# Stop containers (keeps volumes)
docker compose down

# Full reset (removes all data)
docker compose down -v

# Rebuild a specific service
docker compose build api
docker compose up --build api
```

---

## Environment Injection

Docker Compose reads variables from three sources in order of precedence:
1. Shell environment (highest)
2. `.env` file in the project root (if present)
3. Default values defined in `docker-compose.yml` with `${VAR:-default}` syntax

Source 2 is the **repo-root** `.env` — Compose does not read `backend/.env` for
interpolation. `DB_PASSWORD` and `APP_KEY` must therefore live in the root file;
`docker compose up` fails immediately with `DB_PASSWORD must be set in .env`
otherwise. Start from `cp .env.example .env`.

The `api` service also sees `backend/.env` via the volume mount, but env vars
injected by Compose **override** what's in the file. Under Docker, `backend/.env`
is effectively unnecessary — it exists for running the backend standalone.

---

## Production Container Build

The `frontend/Dockerfile` has three stages:

```
development  →  npm run dev
builder      →  npm run build (standalone output)
production   →  node server.js (minimal Node runtime)
```

To build and run the production frontend container locally:

```bash
cd frontend

# BACKEND_URL must be a BUILD arg: next.config.ts bakes it into the /api/*
# rewrite at build time, so passing it at runtime has no effect. The build fails
# outright if it is missing, rather than defaulting to the production backend.
docker build \
  --target production \
  --build-arg BACKEND_URL=https://expense-tracker-singapore.onrender.com \
  -t expense-tracker-web:prod .

docker run -p 3000:3000 expense-tracker-web:prod
```

Note that `docker-compose.yml` uses the plain `node:20-alpine` image for `web`
and never builds this Dockerfile — it is used by the Vercel/production path only.
