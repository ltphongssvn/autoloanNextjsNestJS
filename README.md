# AutoLoan – Next.js + NestJS Monorepo

A full-stack auto loan application system built with a strict TypeScript monorepo architecture.

## Architecture
```
autoloanNextjsNestJS/
├── apps/
│   ├── frontend/          # Next.js 16 (App Router, Tailwind CSS)
│   └── backend/           # NestJS 11 (REST API, Prisma ORM)
├── packages/
│   └── shared-types/      # Shared TypeScript interfaces & enums
├── .pre-commit-config.yaml
├── .secrets.baseline
└── SECURITY.md
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 16, React 19, TypeScript    |
| Backend     | NestJS 11, Prisma 6, PostgreSQL     |
| Auth        | JWT (passport-jwt), bcryptjs, RBAC  |
| Testing     | Jest (backend), Vitest (frontend)   |
| Security    | detect-secrets, helmet, throttler   |

## Backend Modules

| Module       | Endpoints                                         |
|--------------|---------------------------------------------------|
| Auth         | POST /auth, POST /auth/signup, POST /auth/logout  |
| Applications | CRUD + PATCH status with role-based access         |
| Documents    | Upload, list, status update per application        |
| Notes        | Create, list per application (staff only)          |
| Users        | GET /users/me, PATCH /users/me                     |
| Health       | GET /health                                        |

## Frontend Pages

| Route                              | Description                 |
|------------------------------------|-----------------------------|
| /                                  | Landing page                |
| /login                             | Login form                  |
| /signup                            | Registration form           |
| /dashboard                         | Applications list           |
| /dashboard/applications/new        | New loan application form   |
| /dashboard/applications/[id]       | Application detail + actions|

## Quick Start
```bash
# Install dependencies
npm install

# Generate Prisma client
cd apps/backend && npx prisma generate && cd ../..

# Set up environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Run development
npm run dev

# Run all tests
npm test
```

## Test Coverage

- **Backend**: 123 tests, 100% coverage (Jest, 80% per-file threshold enforced)
- **Frontend**: 76 tests, 97%+ coverage (Vitest, 80% per-file threshold enforced)
- **Total**: 199 tests

## Pre-commit Hooks

| Hook                    | Stage      | Description                      |
|-------------------------|------------|----------------------------------|
| detect-secrets          | pre-commit | Scan for leaked secrets          |
| block-large-binaries    | pre-commit | Block .h5, .pkl, .pth, etc.     |
| block-env-files         | pre-commit | Block .env (allow .env.example)  |
| fix-line-endings        | pre-commit | Normalize to LF                  |
| trailing-whitespace     | pre-commit | Remove trailing whitespace       |
| validate-json/yaml      | pre-commit | Syntax validation                |
| eslint-frontend         | pre-commit | ESLint zero warnings             |
| typescript-check-backend| pre-commit | tsc --noEmit                     |
| test-backend/frontend   | pre-commit | Run test suites                  |
| coverage-backend/frontend| pre-push  | Enforce 80% thresholds           |
| build-backend/frontend  | pre-push   | Verify production builds         |

## Environment Variables

See `apps/backend/.env.example` and `apps/frontend/.env.example`.
