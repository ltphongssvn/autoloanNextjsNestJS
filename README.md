# AutoLoan Application System

Full-stack auto loan application platform built with **Next.js 16**, **NestJS 11**, **Prisma 6**, and **PostgreSQL**.

## Architecture
```
autoloanNextjsNestJS/
├── apps/
│   ├── frontend/          # Next.js 16 (App Router, Tailwind CSS 4)
│   └── backend/           # NestJS 11 (REST API, Prisma ORM)
├── packages/
│   └── shared-types/      # Shared TypeScript interfaces
├── e2e/                   # Playwright E2E tests
├── prisma/                # Schema & seed data
└── docker-compose.yml     # PostgreSQL + app containers
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | NestJS 11, Prisma 6, PostgreSQL, JWT Auth |
| Testing | Jest (backend), Vitest (frontend), Playwright (E2E) |
| Security | Rate limiting (60 req/min), ValidationPipe, bcrypt, detect-secrets |
| Docs | Swagger/OpenAPI at `/api/docs` |
| CI/CD | GitHub Actions, Docker, pre-commit hooks |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check (skip throttle) |
| POST | `/auth/login` | No | Login with email/password |
| POST | `/auth/signup` | No | Register customer account |
| POST | `/auth/logout` | JWT | Invalidate token |
| POST | `/applications` | JWT | Create application |
| GET | `/applications` | JWT | List applications |
| GET | `/applications/:id` | JWT | Get application detail |
| GET | `/applications/:id/history` | Staff | Status history |
| PATCH | `/applications/:id/status` | Staff | Update status |
| POST | `/applications/:id/documents` | JWT | Upload document |
| GET | `/applications/:id/documents` | JWT | List documents |
| PATCH | `/documents/:id/status` | Staff | Verify/reject document |
| POST | `/applications/:id/notes` | Staff | Create note |
| GET | `/applications/:id/notes` | Staff | List notes |
| GET | `/users/me` | JWT | Get profile |
| PATCH | `/users/me` | JWT | Update profile |

## Frontend Pages & Components

**Pages:** Landing, Login, Signup, Dashboard, Application Detail, New Application (4-step form), Profile, 404

**Components:** Navigation, DocumentUpload, NotesList, StatusHistory, LoadingSkeleton, ErrorBoundary, Toast

**Hooks:** useDebounce, useLocalStorage

**Utilities:** formatCurrency, formatDate

## Getting Started
```bash
# Install dependencies
npm install

# Setup database
cp .env.example .env
docker-compose up -d postgres
npx prisma migrate dev
npx prisma db seed

# Run development
npm run dev          # Both frontend + backend
npm run dev:frontend # Frontend only (port 3000)
npm run dev:backend  # Backend only (port 3001)

# Run tests
cd apps/backend && npx jest --coverage
cd apps/frontend && npx vitest run --coverage
npx playwright test   # E2E tests
```

## Test Coverage

| Suite | Tests | Statements | Branches | Functions | Lines |
|-------|-------|-----------|----------|-----------|-------|
| Backend (Jest) | 146 | 100% | 98.73% | 100% | 100% |
| Frontend (Vitest) | 191 | 99% | 92.74% | 100% | 99.71% |
| **Total** | **337** | | | | |

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | customer |
| bob@example.com | password123 | customer |
| carol@example.com | password123 | customer |
| officer1@example.com | password123 | loan_officer |
| officer2@example.com | password123 | loan_officer |
| underwriter1@example.com | password123 | underwriter |
| admin@example.com | password123 | admin |

## Modules

- **Auth:** JWT authentication, bcrypt hashing, token blacklist, role-based access
- **Applications:** CRUD, multi-step form, status workflow (draft → submitted → under_review → approved/rejected)
- **Documents:** File upload (multer), verify/reject workflow, type categorization
- **Notes:** Internal/external notes, staff-only creation
- **Users:** Profile management
- **Notifications:** Email service (status changes, submissions, approvals, rejections)

## Pre-commit Hooks

- detect-secrets (credential scanning)
- ESLint + TypeScript compilation
- Unit tests with coverage thresholds (80%)
- Build verification
