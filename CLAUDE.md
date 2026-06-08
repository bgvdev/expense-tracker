# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack expense tracker with three services managed by Docker Compose:

- **`backend/`** — Laravel 11 / PHP 8.3 REST API. Runs behind Nginx + PHP-FPM, deployed on Render.
- **`frontend/`** — Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS SPA, deployed on Vercel.
- **PostgreSQL 15** — hosted on Neon; accessed only by the backend.

Auth is stateless: Sanctum issues a plain-text Bearer token on login/register, which the frontend stores in `localStorage` and sends in every request. No cookies, no CSRF.

## Local API proxying vs production

In **local dev** (Docker or standalone), `next.config.ts` rewrites all `/api/*` requests to `BACKEND_URL` (defaults to `http://localhost:8000`). The frontend never calls the backend directly — requests go through the Next.js dev server proxy, avoiding CORS.

In **production**, `frontend/src/lib/api.ts` hard-codes the Render URL (`https://expense-tracker-funw.onrender.com`). There is no env-based URL switching in `api.ts` — change `BASE_URL` in that file when targeting a different environment.

## Database schema note

All three custom tables are **singular** (`user`, `category`, `expense`), not the Laravel-default plural. Every model explicitly declares `protected $table`. Any new models must follow this pattern.

## API routes

All routes are prefixed `/api`. Defined in `backend/routes/api.php`:

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | public |
| GET | `/api/categories` | public |
| POST | `/api/auth/register` | public (rate-limited 10/min) |
| POST | `/api/auth/login` | public (rate-limited 10/min) |
| POST | `/api/auth/logout` | Sanctum |
| GET | `/api/auth/me` | Sanctum |
| PATCH | `/api/auth/profile` | Sanctum |
| PATCH | `/api/auth/password` | Sanctum |
| GET | `/api/expenses` | Sanctum |
| POST | `/api/expenses` | Sanctum |
| PATCH | `/api/expenses/{id}` | Sanctum |
| DELETE | `/api/expenses/{id}` | Sanctum |

Expenses are always returned wrapped in `{ data: [...] }` via `ExpenseResource`, with nested category and ISO 8601 dates.

## Frontend structure

```
src/
  app/           # Next.js App Router pages: login, register, dashboard, settings
  components/    # ExpenseForm, ExpenseList, EditExpenseModal
  hooks/         # useAuth (AuthContext + provider), useExpenses
  lib/           # api.ts (fetch wrapper), types.ts (shared TS interfaces)
```

`AuthProvider` wraps the entire app in `layout.tsx`. All pages that need auth check `useAuth()`. `useExpenses` manages expenses state (fetch/add/update/remove) as a standalone hook used by the dashboard.

## Seeding

`DatabaseSeeder` seeds 6 default categories via `CategorySeeder` and optionally a test user (`test@example.com / password`) when the `SEED_TEST_USER=true` env var is set. Never set this in production.

## Keepalive

`.github/workflows/keepalive.yml` pings `GET /api/health` every 13 minutes to prevent Render from sleeping the backend on the free tier.

## Commands

### Docker (recommended for full-stack dev)
```bash
docker compose up --build          # first run
docker compose up                  # subsequent runs
docker compose down
```

### Backend (standalone)
```bash
cd backend
composer install
php artisan migrate
php artisan db:seed                # seeds categories + a test user (test@example.com)
php artisan serve                  # starts dev server on :8000
php artisan test                   # run all tests
php artisan test --filter TestName # run a single test
```

### Frontend (standalone)
```bash
cd frontend
npm install
npm run dev    # starts on :3000
npm run build
npm run lint
```
