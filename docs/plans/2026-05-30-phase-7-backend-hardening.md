# Phase 7: Backend Hardening, Audit, Seed Data, And Marking Polish

Goal: make the backend repository marker-ready without starting frontend work.

Plan:

1. Audit actual Express routes against `docs/openapi.json`.
2. Add tests for conditional film detail requests, OpenAPI validity, password-hash response safety, invalid query validation, and seed documentation.
3. Add ETag and Last-Modified headers to `GET /api/v1/films/:id` and return `304 Not Modified` when request validators match.
4. Add a Prisma seed script with demo admin/user accounts, films, tracking records, and one message.
5. Update package scripts, README, `.env` documentation, and OpenAPI parity details.
6. Run Prisma validation, full Jest/Supertest suite, TypeScript build, and lightweight hardcoded-secret checks.

Deferred:

- React frontend.
- New large dependencies.
