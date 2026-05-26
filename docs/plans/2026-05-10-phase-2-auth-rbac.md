# CinemaVault Phase 2 Auth And RBAC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add registration, login, JWT authentication, and role-based access control without implementing film or messaging features.

**Architecture:** Auth routes live under `src/modules/auth`, reusable JWT/RBAC middleware lives under `src/middleware`, and the admin ping route is a narrow protected endpoint used to prove RBAC behavior. Jest + Supertest tests use the exported Express app and a SQLite test database managed by Prisma.

**Tech Stack:** Express, TypeScript, Prisma, SQLite, Zod, bcrypt, jsonwebtoken, Jest, Supertest.

---

### Task 1: Auth Test Coverage

**Files:**
- Create: `tests/auth.test.ts`
- Modify: `tests/setupEnv.cjs`

**Steps:**
1. Add tests for register success, duplicate conflict, login success, wrong password, missing token, invalid token, user blocked from admin route, and admin allowed.
2. Reset the test database between tests using Prisma.
3. Use `request(app)` only; do not start the server.

### Task 2: Dependencies and Environment

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/config/env.ts`

**Steps:**
1. Install bcrypt and jsonwebtoken plus TypeScript types.
2. Add test database setup script.
3. Add JWT and bcrypt environment validation.

### Task 3: Auth Implementation

**Files:**
- Create: `src/modules/auth/auth.schemas.ts`
- Create: `src/modules/auth/auth.service.ts`
- Create: `src/modules/auth/auth.routes.ts`
- Create: `src/middleware/authenticate.ts`
- Create: `src/middleware/authorizeRoles.ts`
- Create: `src/routes/admin.routes.ts`
- Modify: `src/app.ts`
- Modify: `src/types/express.d.ts`

**Steps:**
1. Validate register/login bodies with Zod.
2. Hash passwords with bcrypt and store only `passwordHash`.
3. Return JWTs on successful register/login.
4. Authenticate Bearer tokens and attach the authenticated user to `req.user`.
5. Authorize admin-only routes with RBAC.

### Task 4: Documentation and Verification

**Files:**
- Modify: `README.md`

**Commands:**
- `npm test`
- `npm run build`

**Expected:**
- Auth/RBAC tests and existing health test pass.
- TypeScript build exits with code 0.
