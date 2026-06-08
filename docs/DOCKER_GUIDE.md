# Docker Guide

## Services

```
docker-compose.yml
├── db      postgres:15-alpine          :5432
├── api     backend/Dockerfile          :8000  (Nginx + PHP-FPM)
└── web     node:20-alpine              :3000  (Next.js dev server)
```

---

## Container Details

### `db` — PostgreSQL 15

- Image: `postgres:15-alpine`
- Persistent volume: `db_data` mounted at `/var/lib/postgresql/data`
- Credentials come from `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in the host environment
- Exposes port 5432 to the host for tools like TablePlus or psql
- Has a healthcheck — the `api` service waits for it before starting

### `api` — Laravel Backend

- Built from `backend/Dockerfile`
- PHP 8.3-FPM + Nginx in a single container (processes managed by the entrypoint script)
- Bind-mount: `./backend` → `/var/www/html` (live code reload in dev)
- Named volume: `backend_vendor` — preserves `vendor/` across host-side edits
- Startup sequence (via `docker-entrypoint.sh`):
  1. Fix storage/cache directory permissions
  2. Generate `APP_KEY` if not set
  3. Retry `php artisan migrate --force` up to 10 times (waits for db)
  4. Run `php artisan db:seed --force` only if `SEED_TEST_USER=true`
  5. Start PHP-FPM in background
  6. Start Nginx in foreground (PID 1)
- Nginx listens on port 8000 and proxies `.php` requests to PHP-FPM on `127.0.0.1:9000`

### `web` — Next.js Frontend

- Image: `node:20-alpine` (does not use `frontend/Dockerfile`)
- Bind-mount: `./frontend` → `/app` (live code reload)
- Named volume: `frontend_node_modules` — preserves `node_modules/` across rebuilds
- Runs `npm install --prefer-offline && npm run dev`
- `WATCHPACK_POLLING=true` enables file watching inside Docker on systems where inotify doesn't work across mounts

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
- `web` container calls the API at `http://api:8000` (or `http://localhost:8000` from the host)

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

# Run npm commands
docker compose exec web npm install <package>

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

The `api` service reads `backend/.env` via the volume mount — but env vars injected by Compose **override** what's in the file. This means you can set `APP_DEBUG=false` in Compose without editing `backend/.env`.

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

# Build with your API URL baked in
docker build \
  --target production \
  --build-arg NEXT_PUBLIC_API_URL=https://expense-tracker-funw.onrender.com \
  -t expense-tracker-web:prod .

docker run -p 3000:3000 expense-tracker-web:prod
```
