# CinemaVault Phase 5 Direct Messages Implementation Note

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add secure direct messages where registered users can message administrators about films and administrators can view, reply to, and soft-delete messages.

**Architecture:** Message routes live in `src/modules/messages`. User-facing routes are mounted at `/api/v1/messages` with JWT authentication. Admin routes are mounted at `/api/v1/admin/messages` with JWT authentication plus `ADMIN` RBAC. Services scope normal user reads by authenticated user id and exclude soft-deleted messages from normal user lists.

**Tech Stack:** Express, TypeScript, Prisma, SQLite, Zod, JWT, Jest, Supertest.

---

### Scope

- Add user message list and create routes.
- Add admin message list, reply, and soft-delete routes.
- Validate message bodies and message id params with Zod.
- Return HATEOAS-style message links.
- Cover user isolation, admin RBAC, missing film, invalid body, reply, delete, and soft-delete list behavior with Supertest.

### Non-Scope

- Frontend
- OMDB import
- Full OpenAPI documentation
