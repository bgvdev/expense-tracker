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

### 2. Create the backend env file

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at minimum:

```dotenv
APP_KEY=          # generated in step 3
DB_PASSWORD=changeme   # any password you choose
SEED_TEST_USER=true    # creates test@example.com/password on first run
```

### 3. Generate the application key

```bash
docker run --rm -v "$PWD/backend":/app -w /app php:8.3-cli php artisan key:generate
```

Or after the containers are up:

```bash
docker compose exec api php artisan key:generate
```

### 4. Create the frontend env file

```bash
cp frontend/.env.example frontend/.env.local
# Default value (http://localhost:8000) is correct for Docker — no changes needed
```

### 5. Start all services

```bash
docker compose up --build   # first run (builds images, runs migrations, seeds db)
docker compose up           # subsequent runs
```

### 6. Verify everything is running

| URL | Expected |
|-----|----------|
| http://localhost:3000 | Next.js login page |
| http://localhost:8000/api/health | `{"status":"ok"}` |
| http://localhost:5432 | PostgreSQL (via psql or TablePlus) |

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
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 (or production URL)
npm run dev           # http://localhost:3000
```

---

## Troubleshooting

**`DB_PASSWORD must be set in .env`** — Docker Compose now requires `DB_PASSWORD` to be set explicitly. Add it to `backend/.env`.

**Port already in use** — Check for conflicting processes: `lsof -i :8000` or `lsof -i :3000`.

**Migrations fail on first run** — The `api` container waits for the database healthcheck (up to 30 seconds). If it keeps failing, run `docker compose logs db` to investigate.

**Frontend shows "Is the API running?"** — Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` and that the `api` container is healthy (`docker compose ps`).
