# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack expense tracker with three services managed by Docker Compose:

- **`backend/`** — Laravel 13 / PHP 8.3 REST API. Runs behind Nginx + PHP-FPM, deployed on Render.
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
| POST | `/api/auth/register` | public (rate-limited 10/min) |
| POST | `/api/auth/login` | public (rate-limited 10/min) |
| POST | `/api/auth/logout` | Sanctum |
| GET | `/api/auth/me` | Sanctum |
| PATCH | `/api/auth/profile` | Sanctum |
| PATCH | `/api/auth/password` | Sanctum |
| GET | `/api/categories` | Sanctum |
| POST | `/api/categories` | Sanctum |
| PATCH | `/api/categories/{id}` | Sanctum |
| DELETE | `/api/categories/{id}` | Sanctum |
| GET | `/api/expenses` | Sanctum |
| POST | `/api/expenses` | Sanctum |
| PATCH | `/api/expenses/{id}` | Sanctum |
| DELETE | `/api/expenses/{id}` | Sanctum |

Categories returns each row with an `is_global` flag (`true` for the shared defaults with `user_id = null`, `false` for the user's own). `store`/`update`/`destroy` act only on the authenticated user's own categories; `destroy` is blocked (422) while expenses reference the category.

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

Two tiers, split by purpose:

- **Reference data (always):** `CategorySeeder` seeds the 6 default global categories (`user_id = null`). It is idempotent (`firstOrCreate` on `slug`), and `docker-entrypoint.sh` runs it on **every** boot in all environments — production included — so the defaults always exist.
- **Test fixtures (gated):** `DatabaseSeeder` additionally creates a test user (`test@example.com / password`) only when `SEED_TEST_USER=true`. The entrypoint runs the full `DatabaseSeeder` only under that flag. **Never set `SEED_TEST_USER=true` in production.**

## Deployment & CI/CD

Code flows: **PR → CI gate → merge to `main` → platform auto-deploy → auto-migrate → health check → live → Sentry**.

- **CI gate** — `.github/workflows/ci.yml` runs on every PR into `main` (and feature-branch pushes): a `backend` job (Composer install → `pint --test` lint → `php artisan test` on SQLite in-memory) and a `frontend` job (`npm ci` → `npm run lint` → `tsc --noEmit` → `npm run build`). Branch protection on `main` requires both to pass before merge — this is what keeps unvalidated/unmerged work from diverging from production.
- **Deploy** — both platforms auto-deploy natively on push to `main`. Backend (Render) is described as code in `render.yaml`; the frontend is on Vercel's Git integration. There is **no GitHub Action that triggers the deploy** — the platforms do it.
- **Migrations & seeding** — run automatically in `backend/docker-entrypoint.sh` (`migrate --force --isolated`, then `CategorySeeder`). Render's free tier has the **Shell disabled**, so this must stay automatic — never rely on running migrations by hand. Render also gates traffic on `healthCheckPath: /api/health`.
- **Post-deploy verify** — `.github/workflows/deploy.yml` (on push to `main`) polls `/api/health` until it returns 200 (fails the run if the deploy never comes up) and records a Sentry release for the commit SHA.
- **Error monitoring** — Sentry on both runtimes: backend via `sentry/sentry-laravel` (wired in `bootstrap/app.php`, `SENTRY_LARAVEL_DSN`), frontend via `@sentry/nextjs` (`sentry.*.config.ts` + `src/instrumentation*.ts`, `NEXT_PUBLIC_SENTRY_DSN`). Both are inert when their DSN is empty, so local dev stays quiet.

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
php artisan test                   # run all tests (SQLite in-memory)
php artisan test --filter TestName # run a single test
./vendor/bin/pint                  # auto-format to house style (pint.json)
./vendor/bin/pint --test           # lint check (CI gate, no changes)
```

### Frontend (standalone)
```bash
cd frontend
npm install
npm run dev    # starts on :3000
npm run build
npm run lint
```
