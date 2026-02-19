<!-- SECURITY.md -->
<!-- Project: autoloanNextjsNestJS (Auto Loan App - Next.js + NestJS Full-Stack) -->
# Security Best Practices Implementation

## Secret Management Implementation

### 1. Pre-commit Secret Detection Setup

**Installation:**
```bash
pip install pre-commit detect-secrets
```

**Configuration (.pre-commit-config.yaml):**
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: .*\.lock|.*\.log|package-lock\.json
```

**Activation:**
```bash
detect-secrets scan > .secrets.baseline
pre-commit install
pre-commit install --hook-type pre-push
```

### 2. Environment Variables Required

#### Frontend (`apps/frontend/.env.local`) — never commit:
```bash
# Next.js Public Variables (exposed to browser)
NEXT_PUBLIC_APP_NAME=AutoLoan
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Node Environment
NODE_ENV=development
```

#### Backend (`apps/backend/.env`) — never commit:
```bash
# Database (used by NestJS / Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/autoloan_development # pragma: allowlist secret

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=3600

# Email/SMTP (server-side only)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Node Environment
NODE_ENV=development
```

### 3. Security Measures Implemented

| Layer | Tool/Practice | Scope | Purpose |
|-------|--------------|-------|---------|
| Secret Detection | detect-secrets + pre-commit | Monorepo | Prevent secrets from entering codebase |
| .env Protection | pre-commit hook `check-env-files` | Monorepo | Block .env files from being committed |
| Dependencies | npm audit | Monorepo | Scan for vulnerable packages |
| HTTP Headers | NestJS Helmet middleware | Backend | OWASP security headers |
| Rate Limiting | NestJS ThrottlerModule | Backend | Prevent brute force / DDoS |
| Input Validation | class-validator + class-transformer (NestJS) | Backend | Validate all request payloads via DTOs |
| Input Validation | Zod (Next.js forms) | Frontend | Client-side form validation |
| Authentication | JWT via @nestjs/jwt + @nestjs/passport | Backend | Stateless token-based auth |
| Authorization | NestJS Guards (roles: Customer / Officer / Underwriter) | Backend | Role-based access control |
| CORS | NestJS enableCors() | Backend | Restrict cross-origin requests |
| SQL Injection | Prisma ORM (parameterized queries) | Backend | Prevent SQL injection |
| Password Hashing | bcrypt (12 rounds) | Backend | Secure password storage |
| MFA | TOTP-based two-factor auth | Backend | Two-factor authentication |
| SSR Security | Next.js Server Components (no client secrets) | Frontend | Secrets never reach browser bundle |
| Type Safety | TypeScript strict mode | Monorepo | Catch errors at compile time |
| Shared Types | packages/shared-types | Monorepo | Single source of truth for types |

### 4. Architecture-Specific Security Notes

#### Frontend (Next.js)
- **Server vs Client:** Never prefix secrets with `NEXT_PUBLIC_` — only public-safe values use that prefix
- **Server Components:** Default in App Router — secrets accessed here never reach the client bundle
- **API Calls:** Frontend calls NestJS backend via `NEXT_PUBLIC_API_URL`; no direct DB access from frontend

#### Backend (NestJS)
- **Guards:** All protected endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)`
- **DTOs:** Every endpoint validates input via class-validator decorated DTOs
- **Helmet:** Applied globally for security headers (X-Frame-Options, CSP, etc.)
- **ThrottlerModule:** Rate limiting applied globally, stricter on auth endpoints
- **CORS:** Configured to allow only the frontend origin

### 5. Pre-commit Workflow

Every commit automatically:
1. Scans for secrets using detect-secrets
2. Blocks commit if new secrets found
3. Blocks .env files from being committed (including nested in subdirectories)
4. Validates JSON and YAML files
5. Fixes line endings and trailing whitespace
6. Runs ESLint for code quality (when workspaces active)
7. Runs TypeScript type checking for both frontend and backend (when workspaces active)

**Pre-push:** Runs build verification for both Next.js and NestJS.

**Manual scan:**
```bash
pre-commit run --all-files
```

### 6. Team Guidelines

- Never commit `.env`, `.env.local`, or `.env.*` files
- Use environment variables for all credentials
- Run `pre-commit install && pre-commit install --hook-type pre-push` after cloning
- Review `.secrets.baseline` changes carefully
- Rotate any accidentally exposed keys immediately
- Run `npm audit` regularly to check for vulnerable dependencies
- Keep all dependencies updated
- Use `NEXT_PUBLIC_` prefix ONLY for browser-safe values in the frontend
- All secrets belong in the NestJS backend — frontend only holds public config
- Shared TypeScript types ensure contract safety between frontend and backend

### 7. Dependency Security Audit
```bash
# Check for known vulnerabilities (from monorepo root)
npm audit

# Fix automatically where possible
npm audit fix

# Full report
npm audit --json
```

## Verification
```bash
$ pre-commit run --all-files
Detect secrets...........................................................Passed
Block Large Binary Files.................................................Passed
Block .env Files.........................................................Passed
Fix Line Endings to LF..................................................Passed
Fix End of Files.........................................................Passed
Trim Trailing Whitespace.................................................Passed
Validate JSON Files......................................................Passed
Validate YAML Files......................................................Passed
Check for Large Files....................................................Passed
```

All secrets removed and pre-commit protection active.
