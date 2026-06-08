# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack expense tracker with three services managed by Docker Compose:

- **`backend/`** — Laravel 11 / PHP 8.3 REST API. Runs behind Nginx + PHP-FPM, deployed on Railway.
- **`frontend/`** — Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS SPA.
- **PostgreSQL 15** — the only database; accessed only by the backend.

The frontend calls the backend over HTTP. In production, `frontend/src/lib/api.ts` hard-codes the Railway URL (`https://expense-tracker-production-a8e6.up.railway.app`). There is no env-based URL switching — change `BASE_URL` in that file when targeting a different environment.

Auth is stateless: Sanctum issues a plain-text Bearer token on login/register, which the frontend stores in `localStorage` and sends in every request. No cookies, no CSRF.

## Database schema note

All three custom tables are **singular** (`user`, `category`, `expense`), not the Laravel-default plural. Every model explicitly declares `protected $table`. Any new models must follow this pattern.

## API routes

All routes are prefixed `/api`. Defined in `backend/routes/api.php`:

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | public |
| GET | `/api/categories` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | Sanctum |
| GET | `/api/auth/me` | Sanctum |
| GET | `/api/expenses` | Sanctum |
| POST | `/api/expenses` | Sanctum |

There are no update or delete endpoints yet.

## Frontend structure

```
src/
  app/           # Next.js App Router pages (login, register, dashboard)
  components/    # ExpenseForm, ExpenseList
  hooks/         # useAuth (AuthContext + provider), useExpenses
  lib/           # api.ts (fetch wrapper), types.ts (shared TS interfaces)
```

`AuthProvider` wraps the entire app in `layout.tsx`. All pages that need auth check `useAuth()`.

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
