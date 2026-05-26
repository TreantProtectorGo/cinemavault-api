# CinemaVault Phase 3 Films Implementation Note

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the core Film resource with public browsing, search/filter/sort/pagination, admin-only mutation routes, validation, and Supertest coverage.

**Architecture:** Film logic is isolated in `src/modules/films` with Zod schemas, a Prisma-backed service, and Express routes. Public `GET` routes do not require authentication, while `POST`, `PUT`, and `DELETE` use existing JWT authentication plus `ADMIN` RBAC middleware.

**Tech Stack:** Express, TypeScript, Prisma, SQLite, Zod, JWT, Jest, Supertest.

---

### Scope

- Add `GET /api/v1/films` and `GET /api/v1/films/:id` as public routes.
- Add `POST /api/v1/films`, `PUT /api/v1/films/:id`, and `DELETE /api/v1/films/:id` as admin-only routes.
- Validate route params, query params, and request bodies with Zod.
- Return HATEOAS-style links on film resources.
- Cover required public browsing, admin authorization, validation, update, and delete cases with Supertest.

### Non-Scope

- Frontend
- Favourites
- Watchlist
- Watched records
- Messages
- OMDB import
- Full OpenAPI documentation
