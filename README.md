# Auto Loan Application System

Full-stack monorepo for managing auto loan applications with role-based workflows.

## Architecture
```
autoloanNextjsNestJS/
├── apps/
│   ├── backend/          # NestJS 11 REST API
│   └── frontend/         # Next.js 16 React UI
├── packages/
│   └── shared-types/     # Shared TypeScript interfaces
├── docker-compose.yml
└── package.json          # Root workspace scripts
```

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | Next.js 16, React 19, TypeScript              |
| Backend     | NestJS 11, TypeScript, Prisma 6               |
| Database    | PostgreSQL 16                                 |
| Auth        | JWT (access tokens), bcrypt password hashing  |
| Validation  | class-validator, ValidationPipe               |
| Rate Limit  | @nestjs/throttler (60 req/min)                |
| API Docs    | Swagger/OpenAPI at /api/docs                  |
| File Upload | Multer                                        |
| Testing     | Jest (backend), Vitest (frontend), >80% coverage |
| CI/CD       | GitHub Actions                                |
| Deploy      | Docker Compose                                |

## Quick Start
```bash
# Install dependencies
npm install

# Setup database
cp apps/backend/.env.example apps/backend/.env
npx prisma migrate dev --schema=apps/backend/prisma/schema.prisma
npx prisma db seed --schema=apps/backend/prisma/schema.prisma

# Run dev servers
npm run dev
```

Backend: http://localhost:3001 | Frontend: http://localhost:3000 | Swagger: http://localhost:3001/api/docs

## Docker
```bash
docker compose up --build
```

## Test Accounts

| Email                  | Password     | Role         |
| ---------------------- | ------------ | ------------ |
| john@example.com       | password123  | customer     |
| jane@example.com       | password123  | customer     |
| alice@example.com      | password123  | customer     |
| bob@example.com        | password123  | customer     |
| charlie@example.com    | password123  | customer     |
| officer@example.com    | password123  | loan_officer |
| underwriter@example.com| password123  | underwriter  |

## API Endpoints

| Method | Endpoint                                    | Auth     | Description              |
| ------ | ------------------------------------------- | -------- | ------------------------ |
| GET    | /api/v1/health                              | No       | Health check             |
| POST   | /api/v1/auth/login                          | No       | Login                    |
| POST   | /api/v1/auth/signup                         | No       | Register                 |
| GET    | /api/v1/applications                        | JWT      | List applications        |
| POST   | /api/v1/applications                        | JWT      | Create application       |
| GET    | /api/v1/applications/:id                    | JWT      | Get application detail   |
| PATCH  | /api/v1/applications/:id/status             | Staff    | Update status            |
| GET    | /api/v1/applications/:id/history            | Staff    | Status history           |
| POST   | /api/v1/applications/:id/documents          | JWT      | Upload document          |
| GET    | /api/v1/applications/:id/documents          | JWT      | List documents           |
| PATCH  | /api/v1/documents/:id/status                | Staff    | Verify/reject document   |
| POST   | /api/v1/applications/:id/notes              | Staff    | Add note                 |
| GET    | /api/v1/applications/:id/notes              | Staff    | List notes               |
| GET    | /api/v1/users/me                            | JWT      | Get profile              |
| PATCH  | /api/v1/users/me                            | JWT      | Update profile           |

## Testing
```bash
npm test                        # Run all tests
npm run test:backend            # Backend only
npm run test:frontend           # Frontend only
npm run test:coverage:backend   # Backend coverage
npm run test:coverage:frontend  # Frontend coverage
```

**Coverage:** Backend 100% statements, 132 tests | Frontend 99%+ statements, 117 tests

## Frontend Pages

- `/` — Landing page
- `/login` — Login
- `/signup` — Registration
- `/dashboard` — Applications list with status badges
- `/dashboard/applications/new` — Multi-step application form (4 steps)
- `/dashboard/applications/:id` — Detail with documents, notes, status history
- `/dashboard/profile` — User profile

## Frontend Components

- **Navigation** — Auth-aware nav with role-based links
- **ErrorBoundary** — Catches React errors with reset
- **LoadingSkeleton** — Accessible loading placeholder
- **StatusHistory** — Status change timeline
- **NotesList** — Notes with staff create form
- **DocumentUpload** — File upload with verify/reject for staff

## Pre-commit Hooks

- detect-secrets, ESLint, TypeScript checks
- Tests with bail, coverage enforcement (80% threshold)
- Production build verification on push

## Environment Variables

See `apps/backend/.env.example` and `apps/frontend/.env.example`.
