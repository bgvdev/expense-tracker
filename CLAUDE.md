# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack expense tracker with three services managed by Docker Compose:

- **`backend/`** — Laravel 13 / PHP 8.3 REST API. Runs behind Nginx + PHP-FPM, deployed on Render.
- **`frontend/`** — Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS SPA, deployed on Vercel.
- **PostgreSQL 15** — hosted on Neon; accessed only by the backend.

Auth is stateless: Sanctum issues a plain-text Bearer token on login/register, which the frontend stores in `localStorage` and sends in every request. No cookies, no CSRF.

## API proxying (same in local and production)

The frontend **never calls the backend directly** in any environment — `frontend/src/lib/api.ts` uses `BASE_URL = ''`, so every request is a same-origin relative URL (`/api/*`). The Next.js rewrite in `next.config.ts` proxies `/api/:path*` to `BACKEND_URL`, which **defaults to the Render URL** (`https://expense-tracker-funw.onrender.com`) and falls back there in production on Vercel too. This avoids CORS entirely since the browser only ever talks to the same origin.

To target a different backend (e.g. a local API), set `BACKEND_URL` — in `docker-compose.yml` it's `http://api:8000`; standalone, set it in `.env.local`. Do **not** hard-code URLs in `api.ts`; change the proxy destination instead.

## Database schema note

All four custom tables are **singular** (`user`, `category`, `expense`, `payment_method`), not the Laravel-default plural. Every model explicitly declares `protected $table`. Any new models must follow this pattern.

**Migrations must be idempotent and PostgreSQL-safe.** Guard column additions with `Schema::hasColumn()` and never use `->after()` — it is a MySQL-only hint that Postgres silently ignores. This combination has already caused a column to be missing in production while looking correct locally; see the comment block in `2026_06_08_082536_add_user_id_to_category_table.php`.

Also note that on Postgres a foreign-key constraint does **not** create an index on the referencing column. Any new FK needs an explicit `$table->index(...)`.

## API routes

All routes are prefixed `/api`. Defined in `backend/routes/api.php`:

Every `/api` route is rate-limited by the named `api` limiter (`API_RATE_LIMIT`,
default 120/min), keyed by authenticated user and falling back to IP. The public
`auth` group carries an additional stricter `throttle:10,1` per IP.

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | public — verifies the DB, 503 if unreachable |
| POST | `/api/auth/register` | public (+10/min) |
| POST | `/api/auth/login` | public (+10/min) |
| POST | `/api/auth/forgot-password` | public (+10/min) |
| POST | `/api/auth/reset-password` | public (+10/min) |
| POST | `/api/auth/logout` | Sanctum |
| GET | `/api/auth/me` | Sanctum |
| PATCH | `/api/auth/profile` | Sanctum |
| PATCH | `/api/auth/password` | Sanctum |
| GET | `/api/categories` | Sanctum |
| POST | `/api/categories` | Sanctum |
| PATCH | `/api/categories/{id}` | Sanctum |
| DELETE | `/api/categories/{id}` | Sanctum |
| GET | `/api/payment-methods` | Sanctum (read-only reference data) |
| GET | `/api/expenses` | Sanctum |
| GET | `/api/expenses/summary` | Sanctum — `{ this_month: number }` |
| POST | `/api/expenses` | Sanctum |
| PATCH | `/api/expenses/{id}` | Sanctum |
| DELETE | `/api/expenses/{id}` | Sanctum |
| GET | `/api/admin/stats` | Sanctum + `admin` |
| GET | `/api/admin/activity` | Sanctum + `admin` |
| GET | `/api/admin/users` | Sanctum + `admin` |
| PATCH | `/api/admin/users/{id}/role` | Sanctum + `admin` |
| GET | `/api/admin/categories` | Sanctum + `admin` |
| POST | `/api/admin/categories` | Sanctum + `admin` |
| PATCH | `/api/admin/categories/{id}` | Sanctum + `admin` |
| DELETE | `/api/admin/categories/{id}` | Sanctum + `admin` |

Categories returns each row with an `is_global` flag (`true` for the shared defaults with `user_id = null`, `false` for the user's own). `store`/`update`/`destroy` act only on the authenticated user's own categories; `destroy` is blocked (422) while expenses reference the category. Note `category.slug` has a **global** unique index, so new slugs must be deduped against every row — use `Category::uniqueSlug()`, never a user-scoped check.

Expenses are always returned wrapped in `{ data: [...] }` via `ExpenseResource`, with nested category and ISO 8601 dates.

### Admin

The `admin` middleware alias (`AdminMiddleware`, registered in `bootstrap/app.php`) gates the `/api/admin/*` group on `user.is_admin`. `is_admin` is a boolean column on `user` and is returned by `login`, `register`, `me` **and** `PATCH /auth/profile` — every endpoint returning a user must include it, because the frontend replaces its whole user object with the response. The admin routes operate on **global** categories (`user_id = null`) only.

### Auth token lifecycle

Tokens expire (`SANCTUM_TOKEN_EXPIRATION`, default 7 days). `PATCH /auth/password` revokes every existing token and returns a newly issued one, which the client must store. `POST /auth/reset-password` revokes all tokens without re-issuing. The reset OTP is single-use, expires after 15 minutes, and its row is discarded after 5 incorrect attempts.

## Frontend structure

```
src/
  app/           # Next.js App Router pages: login, register, dashboard, settings
  components/    # feature components (ExpenseForm/List/Filters, Category*, Toast, …)
  components/ui/ # reusable primitives: Modal, ColorPicker, IconPicker, PasswordInput
  hooks/         # useAuth, useExpenses, useCategories, useFilteredExpenses, useToast
  lib/           # api.ts (fetch wrapper), types.ts (shared interfaces), utils.ts
```

`AuthProvider` wraps the entire app in `layout.tsx`; all pages that need auth check `useAuth()`. State hooks are standalone and own one API resource each: `useExpenses` (fetch/add/update/remove), `useCategories` (CRUD over the user's own categories), `useFilteredExpenses` (client-side filtering over the dashboard list). `useToast` provides the app-wide toast notifications. Shared `ui/` primitives back the modals and the category color/icon pickers.

## Seeding

Two tiers, split by purpose:

- **Reference data (always):** `CategorySeeder` (6 default global categories with `user_id = null`) and `PaymentMethodSeeder` (6 payment methods). Both are idempotent (`firstOrCreate` on `slug`), and `docker-entrypoint.sh` runs **both** on every boot in all environments — production included — so the reference data always exists.
- **Test fixtures (gated):** `DatabaseSeeder` additionally creates a test user (`test@example.com / password`) only when `SEED_TEST_USER=true`. The entrypoint runs the full `DatabaseSeeder` only under that flag. **Never set `SEED_TEST_USER=true` in production.**

## Deployment

The deployment flow is **Docker-only** — there are no GitHub Actions. Everything happens on the platforms in response to a push.

Code flows: **push to `main` → Render builds the Docker image → entrypoint auto-migrates + seeds → `healthCheckPath` gate → live → Sentry**.

- **Deploy** — both platforms auto-deploy natively on push to `main`. Backend (Render) is described as code in `render.yaml` (`runtime: docker`, `rootDir: backend`, `dockerfilePath: ./Dockerfile`); the frontend is on Vercel's Git integration. There is no GitHub Action involved — the platforms build and deploy directly from Git.
- **Migrations & seeding** — run automatically in `backend/docker-entrypoint.sh` (`migrate --force` in a DB-wait retry loop, then `CategorySeeder` + `PaymentMethodSeeder`), *before* PHP-FPM/Nginx start serving. If migrations never succeed the entrypoint **exits non-zero** instead of serving traffic against an un-migrated schema. Render's free tier has the **Shell disabled**, so this must stay automatic — never rely on running migrations by hand. Render gates traffic on `healthCheckPath: /api/health`, which verifies the database and returns 503 when it is unreachable.
- **Entrypoint changes need a rebuild** — the script is baked into the image at `/usr/local/bin/docker-entrypoint.sh`, so the `./backend` bind mount does *not* override it. Run `docker compose build api` after editing it.
- **`BACKEND_URL` is a build-time variable** — `next.config.ts` bakes it into the `/api/*` rewrite when the frontend is built, so it must be set as a Vercel env var / Docker `--build-arg`. A production build fails outright if it is missing rather than defaulting to the production backend.
- **No CI gate** — there is no automated lint/test check on PRs. Run `./vendor/bin/pint --test` and `php artisan test` (backend) / `npm run lint` + `npm run build` (frontend) locally before pushing.
  - If you develop via Docker, run them **inside** the containers — the containers create `frontend/node_modules` and `backend/vendor` as root, so host-side runs hit `EACCES`. The backend image is built `--no-dev`, so pint/phpunit need a one-time `docker compose exec api composer install && docker compose exec api php artisan package:discover`. See `docs/DOCKER_GUIDE.md` → Common Commands.
- **Free-tier cold starts** — there is no keepalive ping, so Render sleeps the backend after ~15 min of inactivity; the first request after idle incurs a ~50s cold start. This is an accepted tradeoff of the Docker-only setup.
- **Error monitoring** — Sentry on both runtimes: backend via `sentry/sentry-laravel` (wired in `bootstrap/app.php`, `SENTRY_LARAVEL_DSN`), frontend via `@sentry/nextjs` (`sentry.*.config.ts` + `src/instrumentation*.ts`, `NEXT_PUBLIC_SENTRY_DSN`). Both are inert when their DSN is empty, so local dev stays quiet. (Runtime error reporting still works; only the post-deploy Sentry *release-tagging* step was removed.)

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

## Reference docs

Operational and deeper-architecture docs live at the repo root and in `docs/` — consult them before touching the areas they cover:

- Root: `RUNBOOK.md` (incident response), `MONITORING.md`, `BACKUP_AND_RECOVERY.md`, `SECURITY_CHECKLIST.md`.
- `docs/`: `ARCHITECTURE.md`, `DEPLOYMENT_GUIDE.md`, `PRODUCTION_SETUP.md`, `LOCAL_SETUP.md`, `DOCKER_GUIDE.md`, `ENVIRONMENT_VARIABLES.md`.
- **Historical, do not treat as current:** `docs/CONFIGURATION_AUDIT.md` and `docs/REFACTORING_PLAN.md` are point-in-time snapshots from 2026-06-08. They predate the admin panel, payment methods, password reset, charts, and pagination.
