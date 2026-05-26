# CinemaVault Phase 4 Tracking Implementation Note

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add authenticated user favourites, watchlist, and watched tracking endpoints without implementing messages, OMDB, frontend, or OpenAPI.

**Architecture:** Each tracking resource has its own `schemas`, `service`, and `routes` file under `src/modules`. Routes use existing JWT authentication only; no admin role is required. Services always scope reads and writes by `req.user.id` so users cannot access another account's tracking records.

**Tech Stack:** Express, TypeScript, Prisma, SQLite, Zod, JWT, Jest, Supertest.

---

### Scope

- Add `GET`, `POST`, and `DELETE` routes for favourites.
- Add `GET`, `POST`, and `DELETE` routes for watchlist.
- Add `GET`, `POST`, and `DELETE` routes for watched records.
- Validate `filmId` route params and watched body fields with Zod.
- Return HATEOAS-style links for tracking records.
- Cover missing-token, add/remove, duplicate, missing-film, watched validation, and user isolation behaviour with Supertest.

### Non-Scope

- Frontend
- Messages
- OMDB import
- Full OpenAPI documentation
