# AutoLoan - Full-Stack Loan Application Platform

A monorepo auto loan application built with **Next.js 16** (frontend) and **NestJS 11** (backend), using **Prisma 6** ORM with PostgreSQL.

## Architecture
```
autoloanNextjsNestJS/
├── apps/
│   ├── backend/          # NestJS 11 REST API
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/          # Modules: auth, applications, documents, notes, users
│   └── frontend/         # Next.js 16 (App Router)
│       └── src/          # Pages, components, services, context
├── packages/
│   └── shared-types/     # TypeScript interfaces shared across apps
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 16, React 19, TypeScript    |
| Backend     | NestJS 11, TypeScript               |
| ORM         | Prisma 6                            |
| Database    | PostgreSQL 16                       |
| Auth        | JWT (passport-jwt), bcryptjs        |
| API Docs    | Swagger/OpenAPI at `/api/docs`      |
| Testing     | Jest (backend), Vitest (frontend)   |
| CI Quality  | pre-commit hooks, 80%+ coverage     |

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Setup
```bash
# Clone and install
git clone https://github.com/ltphongssvn/autoloanNextjsNestJS.git
cd autoloanNextjsNestJS
npm install

# Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL, JWT_SECRET in .env

# Database setup
cd apps/backend
npx prisma migrate dev
npx prisma db seed

# Run development servers
npm run dev          # Both frontend (3000) + backend (3001)
```

### Docker
```bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

## Test Accounts (after seeding)

| Email                      | Password      | Role         |
|----------------------------|---------------|--------------|
| ltphongssvn@gmail.com      | password123   | customer     |
| tiffany.chen@example.com   | password123   | customer     |
| joseph.nguyen@example.com  | password123   | customer     |
| officer@example.com        | password123   | loan_officer |
| underwriter@example.com    | password123   | underwriter  |

## API Endpoints

| Method | Endpoint                          | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| POST   | `/api/v1/auth/login`              | Public   | Login                    |
| POST   | `/api/v1/auth/signup`             | Public   | Register                 |
| GET    | `/api/v1/applications`            | JWT      | List applications        |
| POST   | `/api/v1/applications`            | Customer | Create application       |
| GET    | `/api/v1/applications/:id`        | JWT      | Get application detail   |
| PATCH  | `/api/v1/applications/:id/status` | Staff    | Update status            |
| GET    | `/api/v1/applications/:id/history`| JWT      | Status change history    |
| GET    | `/api/v1/users/me`                | JWT      | Current user profile     |
| PATCH  | `/api/v1/users/me`                | JWT      | Update profile           |

## Testing
```bash
# Backend tests with coverage
cd apps/backend && npx jest --coverage

# Frontend tests with coverage
cd apps/frontend && npx vitest run --coverage

# Run all via pre-commit hooks
git commit  # Triggers lint, typecheck, tests automatically
```

## Coverage

- **Backend**: 128 tests, 100% statements, 98%+ branches
- **Frontend**: 97 tests, 99%+ statements, 95%+ branches
- **Per-file threshold**: 80% enforced via CI hooks

## Pre-commit Hooks

- `detect-secrets` — blocks credential leaks
- `ESLint` — frontend linting (zero warnings)
- `TypeScript` — backend type checking
- `Jest/Vitest` — unit tests with bail
- **Pre-push**: coverage enforcement + production builds

## License

MIT
