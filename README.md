<!-- README.md -->
<!-- Project: autoloanNextjsNestJS (Auto Loan App - Next.js + NestJS Full-Stack) -->
# Auto Loan App — Next.js + NestJS TypeScript Full-Stack

A monorepo auto loan application with strict TypeScript end-to-end.

## Architecture
```
autoloanNextjsNestJS/
├── apps/
│   ├── frontend/          # Next.js 16 (App Router, React 19, MUI, Tailwind)
│   └── backend/           # NestJS 11 (REST API, Prisma, JWT Auth)
├── packages/
│   └── shared-types/      # Shared TypeScript interfaces & types
├── .pre-commit-config.yaml
├── SECURITY.md
└── package.json           # npm workspaces root
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, MUI 7, Tailwind CSS 4 |
| Backend | NestJS 11, Prisma 6, PostgreSQL |
| Auth | JWT (@nestjs/jwt, @nestjs/passport) |
| Security | Helmet, ThrottlerModule, class-validator DTOs |
| Testing | Jest (backend), Vitest (frontend), 80% per-file threshold |
| Shared | @autoloan/shared-types (single source of truth) |
| Language | TypeScript strict mode everywhere |

## Quick Start
```bash
# Install all dependencies
npm install

# Generate Prisma client
cd apps/backend && npx prisma generate && cd ../..

# Run both apps in development
npm run dev

# Run all tests
npm test

# Run tests with coverage
cd apps/backend && npx jest --coverage && cd ../..
cd apps/frontend && npx vitest run --coverage && cd ../..
```

## Environment Setup

Copy example env files:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit with your values. See [SECURITY.md](./SECURITY.md) for details.

## Pre-commit Hooks
```bash
# Install hooks (run once after cloning)
pre-commit install
pre-commit install --hook-type pre-push

# Manual check
pre-commit run --all-files
```

## Scripts

| Command | Description |
|---------|------------|
| `npm test` | Run all tests (backend + frontend) |
| `npm run dev` | Start both apps in dev mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |

## Coverage Thresholds

Both apps enforce **80% minimum per-file** coverage for:
- Statements
- Branches
- Functions
- Lines
