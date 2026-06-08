# Expense Tracker

A full-stack expense tracking web app — log expenses by category, view your history, and manage your account.

**Live app:** https://trakspend.vercel.app

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Laravel 11, PHP 8.3, Laravel Sanctum |
| Database | PostgreSQL 15 |
| Infra | Docker Compose (local), Vercel (frontend), Render (backend), Neon (database) |

## Getting started

### Full stack (Docker)

Copy the env example and set `DB_PASSWORD` before first run:
```bash
cp backend/.env.example backend/.env   # then set DB_PASSWORD
docker compose up --build              # first run
docker compose up                      # subsequent runs
```

### Backend only
```bash
cd backend
composer install
php artisan migrate
php artisan db:seed         # seeds categories + test user (test@example.com)
php artisan serve           # http://localhost:8000
```

### Frontend only
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

## Deployment

- **Frontend** → [Vercel](https://trakspend.vercel.app)
- **Backend API** → [Render](https://expense-tracker-funw.onrender.com)
- **Database** → [Neon](https://neon.tech) (PostgreSQL 15)

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for full setup instructions.
