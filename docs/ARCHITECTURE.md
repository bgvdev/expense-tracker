# Architecture

## System Architecture

```mermaid
graph TD
    User[Browser / User]

    subgraph Vercel
        FE[Next.js 15 SPA<br/>trakspend.vercel.app]
    end

    subgraph Render
        Nginx[Nginx :8000]
        FPM[PHP-FPM]
        Laravel[Laravel 11 API]
        Nginx --> FPM --> Laravel
    end

    subgraph Neon
        PG[(PostgreSQL 15)]
    end

    User -->|HTTPS| FE
    FE -->|HTTPS Bearer token| Nginx
    Laravel -->|pgsql + SSL| PG
```

---

## Request Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js (Vercel)
    participant API as Laravel API (Render)
    participant DB as PostgreSQL (Neon)

    User->>FE: Open app
    FE->>API: GET /api/auth/me (Bearer token)
    API->>DB: SELECT * FROM user WHERE id = ?
    DB-->>API: User row
    API-->>FE: {id, name, email}
    FE-->>User: Render dashboard

    User->>FE: Submit expense form
    FE->>API: POST /api/expenses (Bearer token + JSON body)
    API->>DB: INSERT INTO expense ...
    DB-->>API: New row
    API-->>FE: ExpenseResource JSON
    FE-->>User: Update expense list
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js
    participant API as Laravel API

    User->>FE: Submit login form
    FE->>API: POST /api/auth/login {email, password}
    API-->>FE: {token, user}
    FE->>FE: localStorage.setItem("auth_token", token)
    FE-->>User: Redirect to /dashboard

    Note over FE,API: Every subsequent request includes<br/>Authorization: Bearer {token}

    User->>FE: Click Sign Out
    FE->>API: POST /api/auth/logout (Bearer token)
    API->>API: Delete personal_access_token row
    API-->>FE: {message: "Logged out successfully"}
    FE->>FE: localStorage.removeItem("auth_token")
    FE-->>User: Redirect to /login
```

---

## Database Schema

```
user
├── id (bigserial PK)
├── name (varchar)
├── email (varchar, unique)
├── password (varchar, bcrypt)
├── remember_token
├── email_verified_at
├── created_at
└── updated_at

category
├── id (bigserial PK)
├── name (varchar)
├── slug (varchar, unique)
├── icon (varchar)  — Material Symbols name
├── color (varchar) — hex color
├── created_at
└── updated_at

expense
├── id (bigserial PK)
├── user_id (FK → user.id, CASCADE DELETE)
├── category_id (FK → category.id)
├── amount (decimal 10,2)
├── description (text, nullable)
├── spent_at (timestamp)
├── created_at
└── updated_at

personal_access_tokens  (Sanctum)
├── id
├── tokenable_type
├── tokenable_id
├── name
├── token (sha256 hash)
├── abilities
├── last_used_at
├── expires_at
└── created_at / updated_at
```

---

## Frontend Structure

```
frontend/src/
├── app/
│   ├── layout.tsx          # Root layout — wraps everything in <AuthProvider>
│   ├── page.tsx            # / → redirects to /dashboard or /login
│   ├── login/page.tsx      # Login form
│   ├── register/page.tsx   # Registration form
│   └── dashboard/page.tsx  # Main app page
├── components/
│   ├── ExpenseForm.tsx     # Add expense form (fetches categories)
│   └── ExpenseList.tsx     # Expense table/list
├── hooks/
│   ├── useAuth.tsx         # AuthContext + AuthProvider
│   └── useAllExpenses.ts   # Expense CRUD state (full list, filtered client-side)
└── lib/
    ├── api.ts              # fetch wrapper (relative URLs; the rewrite routes them)
    └── types.ts            # Shared TypeScript interfaces
```

---

## API Routes

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/health` | Public | inline closure |
| GET | `/api/categories` | Public | CategoryController@index |
| POST | `/api/auth/register` | Public | AuthController@register |
| POST | `/api/auth/login` | Public | AuthController@login |
| POST | `/api/auth/logout` | Sanctum | AuthController@logout |
| GET | `/api/auth/me` | Sanctum | AuthController@me |
| GET | `/api/expenses` | Sanctum | ExpenseController@index |
| POST | `/api/expenses` | Sanctum | ExpenseController@store |

---

## Local Dev Architecture

```mermaid
graph LR
    Browser -->|:13000| Web[web container<br/>node:20-alpine<br/>npm run dev]
    Web -.->|hot reload| Src[./frontend/src]
    Web -->|/api/* rewrite<br/>api:8000| API[api container<br/>Nginx + PHP-FPM<br/>runs as www-data]
    Browser -->|:18000 direct| API
    API -->|db:5432| DB[db container<br/>postgres:15]
    API -.->|bind mount| BackendSrc[./backend]
```

Host ports (`13000`/`18000`/`15432`) are deliberately off the defaults and are
configurable via `WEB_HOST_PORT`, `API_HOST_PORT` and `DB_HOST_PORT`.
Container-internal ports never change. In normal use the browser only talks to
`:13000` — the `/api/*` rewrite proxies to the API, so no cross-origin request is
ever made.
