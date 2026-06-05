# CinemaVault API

CinemaVault is the backend repository for the Coventry University 6003CEM Web API Development CW2 project.

It provides a TypeScript REST API for a secure film discovery platform with public film browsing, JWT authentication, role-based admin controls, user tracking features, direct messages, profile photo upload, OMDB metadata import, OpenAPI documentation, and automated Jest/Supertest coverage.

## Tech Stack

- Node.js 20+
- TypeScript
- Express
- Prisma ORM
- SQLite
- Zod validation
- bcrypt password hashing
- JWT bearer authentication
- Basic Auth evidence endpoint
- Google OAuth public-user sign-in evidence
- Jest + Supertest
- OpenAPI 3.x with Redoc UI

## Coursework Requirement Mapping

- TypeScript REST API: Express app in `src/`
- JSON by default: `express.json()` and JSON API responses
- Backend/frontend separation: this repository is backend only
- Authentication: JWT register/login flow plus public-user Google OAuth sign-in
- Basic Auth evidence: `GET /api/v1/auth/basic-check`
- Authorization: RBAC middleware with `ADMIN` and `USER`
- Public browsing: `GET /api/v1/films`, `GET /api/v1/films/:id`
- Admin film management: `POST`, `PUT`, `DELETE /api/v1/films`
- User features: favourites, watchlist, watched records
- Direct messages: user-to-admin messages with admin reply/delete
- User profile: authenticated profile lookup/update and avatar upload
- External API: admin-only OMDB import
- External authentication: Google OAuth creates or logs in normal `USER` accounts only
- Social feed automation: films made live can publish a configured admin social feed webhook
- Documentation: OpenAPI JSON and Redoc UI
- Testing: Jest + Supertest mock HTTP request tests
- Maintainability: modular route/schema/service structure

## Project Structure

```text
cinemavault-api/
  docs/
    openapi.json
    plans/
  prisma/
    schema.prisma
    seed.ts
  src/
    app.ts
    server.ts
    config/
    db/
    middleware/
    modules/
    routes/
    types/
  tests/
```

`src/app.ts` configures and exports the Express app. `src/server.ts` only starts the HTTP server.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Required local environment values:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
OMDB_API_KEY=replace-with-your-omdb-api-key
GOOGLE_CLIENT_ID=replace-with-your-google-oauth-client-id
SOCIAL_POST_ENABLED=false
SOCIAL_WEBHOOK_URL=https://discord.com/api/webhooks/replace-with-your-discord-webhook
```

Do not commit `.env`. It is ignored by `.gitignore`.

## Database

Validate the Prisma schema:

```bash
npx prisma validate
```

Create or update the local SQLite database:

```bash
npm run prisma:migrate -- --name init
```

Regenerate Prisma Client if needed:

```bash
npm run prisma:generate
```

Seed demo data:

```bash
npm run prisma:seed
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

## Demo Accounts

The seed script creates these demo accounts:

```text
Admin
Email: admin@cinemavault.local
Username: admin
Password: AdminPassword123!

User
Email: member@cinemavault.local
Username: member
Password: UserPassword123!
```

Seed data also includes live films, one favourite, one watchlist item, one watched record, and one sample message with an admin reply.

## Run

Start the development server:

```bash
npm run dev
```

Build the TypeScript project:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

Health check:

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "cinemavault-api"
}
```

## API Documentation

Open the Redoc API documentation UI after starting the server:

```text
http://localhost:4000/api-docs
```

The raw OpenAPI 3.x JSON document is served at:

```text
http://localhost:4000/api-docs/openapi.json
```

The OpenAPI document includes schemas, security schemes, request examples, response examples, query parameters, path parameters, and common error responses.

## Authentication And RBAC

Register a user:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "username": "member",
    "password": "StrongPassword123!",
    "displayName": "Cinema Member"
  }'
```

Public registration always creates a normal `USER` account. Administrator accounts are provisioned internally through the seed script or direct controlled database setup, never through the public register endpoint.

Login:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "member@example.com",
    "password": "StrongPassword123!"
  }'
```

Successful register and login responses include a JWT:

```text
Authorization: Bearer <token>
```

Passwords are hashed with bcrypt before storage. Plain text passwords and `passwordHash` are never returned by API responses.

## Google OAuth Evidence

Public users can also sign in with Google OAuth. The frontend sends the Google Identity Services ID token to:

```text
POST /api/v1/auth/google
```

The backend verifies the token using `GOOGLE_CLIENT_ID`, then creates or logs in a normal `USER` account and returns the same JWT response shape as normal login.

Security rule: Google OAuth can never create or authenticate administrator accounts. If a Google email matches an existing `ADMIN` user, the endpoint returns `403`.

## Basic Auth Evidence

The main application authentication uses JWT. Basic Auth is included only as coursework/lab evidence.

```bash
curl http://localhost:4000/api/v1/auth/basic-check \
  -H "Authorization: Basic $(printf 'member:StrongPassword123!' | base64)"
```

The endpoint accepts `username:password` or `email:password`, checks the password against the stored bcrypt hash, and returns only public user fields.

## User Profile And Photo Upload

Profile routes require JWT and only operate on the authenticated user. They never return `passwordHash` and do not allow role changes.

Get current profile:

```bash
curl http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer <user-token>"
```

Update safe profile fields:

```bash
curl -X PUT http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Cinema Member"
  }'
```

Upload profile photo:

```bash
curl -X POST http://localhost:4000/api/v1/me/profile-photo \
  -H "Authorization: Bearer <user-token>" \
  -F "profilePhoto=@/path/to/avatar.png"
```

Accepted avatar types are `image/jpeg`, `image/png`, and `image/webp`. The maximum upload size is 2MB. Uploaded avatars are stored under `uploads/avatars/`, served from `/uploads/avatars/<filename>`, and ignored by git except for `.gitkeep` placeholders.

## Endpoint Overview

Health:

```text
GET /api/v1/health
```

Auth:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
GET  /api/v1/auth/basic-check
```

Profile:

```text
GET  /api/v1/me
PUT  /api/v1/me
POST /api/v1/me/profile-photo
```

Admin:

```text
GET /api/v1/admin/ping
```

Films:

```text
GET    /api/v1/films
GET    /api/v1/films/:id
POST   /api/v1/films
PUT    /api/v1/films/:id
DELETE /api/v1/films/:id
POST   /api/v1/films/import-omdb
```

Favourites:

```text
GET    /api/v1/favourites
POST   /api/v1/favourites/:filmId
DELETE /api/v1/favourites/:filmId
```

Watchlist:

```text
GET    /api/v1/watchlist
POST   /api/v1/watchlist/:filmId
DELETE /api/v1/watchlist/:filmId
```

Watched:

```text
GET    /api/v1/watched
POST   /api/v1/watched/:filmId
DELETE /api/v1/watched/:filmId
```

Messages:

```text
GET    /api/v1/messages
POST   /api/v1/messages
GET    /api/v1/admin/messages
POST   /api/v1/admin/messages/:id/reply
DELETE /api/v1/admin/messages/:id
```

Docs:

```text
GET /api-docs
GET /api-docs/openapi.json
```

## Film Browsing

Public users can browse and search live films without a token:

```bash
curl "http://localhost:4000/api/v1/films?title=batman&genre=Action&year=2008&sortBy=rating&order=desc&page=1&limit=10"
```

Supported query parameters:

- `title`
- `genre`
- `year`
- `rating`
- `isLive`
- `sortBy`
- `order`
- `page`
- `limit`

Film detail responses include `ETag` and `Last-Modified` headers. Clients can use conditional requests to avoid downloading unchanged film data:

```bash
curl -i http://localhost:4000/api/v1/films/<film-id>

curl -i http://localhost:4000/api/v1/films/<film-id> \
  -H 'If-None-Match: W/"film-<film-id>-<timestamp>"'
```

If the validator matches, the API returns `304 Not Modified`.

## Film Live/Draft And Soft Delete

`isLive` controls publishing only:

- `isLive=true`: visible in the public catalogue
- `isLive=false`: draft/hidden from public browsing

`DELETE /api/v1/films/:id` performs a soft delete by setting `deletedAt` and `isLive=false`. It does not physically remove the row, so favourites, watchlist items, watched records, and messages can keep their film references. Deleted films are excluded from film list responses and film detail lookup returns `404`.

## OMDB Import

OMDB import is admin-only. Set `OMDB_API_KEY` in `.env`; the key is never hardcoded in source code.

```bash
curl -X POST http://localhost:4000/api/v1/films/import-omdb \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imdbId": "tt0133093"
  }'
```

You may send either `imdbId` or `title`. The API maps useful OMDB fields into the `Film` model and stores the raw response in `omdbMetadataJson`.

## Admin Social Feed Automation

When an admin creates a film as live, or changes an existing draft film to live, the API triggers a social feed publisher with basic film details.

This integration is configurable and safe for coursework/demo use:

```env
SOCIAL_POST_ENABLED=true
SOCIAL_WEBHOOK_URL=https://discord.com/api/webhooks/replace-with-your-discord-webhook
```

The webhook request is Discord-compatible and sends the film announcement as `content` plus a small embed. Example generated message:

```text
New film is now live: Inception | (2010) | Genre: Sci-Fi | IMDb 8.8
```

If social posting is disabled or the webhook fails, the film publish action still succeeds. This prevents an external social platform outage from breaking the core catalogue workflow.

## Tracking Features

Favourites, watchlist, and watched routes require JWT. Each request operates only on the authenticated user.

Example add favourite:

```bash
curl -X POST http://localhost:4000/api/v1/favourites/<film-id> \
  -H "Authorization: Bearer <user-token>"
```

Example watched record:

```bash
curl -X POST http://localhost:4000/api/v1/watched/<film-id> \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9,
    "notes": "Strong first contact story."
  }'
```

Duplicate add requests are idempotent and return the existing record with `200`.

## Messages

Registered users can send direct messages to administrators about films. Normal users can only see their own messages and replies. Administrators can view all messages, reply, and soft-delete messages.

Create a message:

```bash
curl -X POST http://localhost:4000/api/v1/messages \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filmId": "<film-id>",
    "subject": "Screening question",
    "body": "Will this film be available in the weekend showcase?"
  }'
```

Admin reply:

```bash
curl -X POST http://localhost:4000/api/v1/admin/messages/<message-id>/reply \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "replyBody": "Yes, it is scheduled for Saturday."
  }'
```

Messages must reference an existing film. Deleted messages are soft-deleted with `status: "DELETED"` and are hidden from normal user message lists.

## Security Features

- `.env` and local database files are ignored by git.
- JWT secret and OMDB API key are loaded from environment variables.
- CORS is configured through `CORS_ORIGIN`.
- Passwords are hashed with bcrypt.
- API responses do not expose `passwordHash`.
- Profile photo uploads are authenticated, type-limited, size-limited, and stored outside committed source files.
- Protected routes use JWT middleware.
- Admin routes use RBAC middleware.
- Basic Auth is isolated to the evidence endpoint.
- Zod validates request bodies, path params, and query params.
- Production error responses do not include stack traces.
- Helmet is enabled.

## Testing

Run the Jest and Supertest suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage:

```bash
npm run test:coverage
```

The test scripts run `prisma db push` against `file:./test.db` before Jest starts. Tests import the Express app directly and use `request(app)`, so they do not start the real HTTP server.

Current test coverage includes:

- Health endpoint
- Registration and login
- Duplicate email/username conflict
- JWT missing/invalid token handling
- RBAC user/admin access checks
- Basic Auth evidence success/failure cases
- Public film browsing, search, filter, sort, pagination
- Invalid film query validation
- Film detail lookup and missing-film handling
- Conditional film detail requests with `ETag`
- Admin film create/update/delete authorization
- OMDB import with mocked external HTTP responses
- Favourites, watchlist, and watched records
- Tracking duplicate prevention and user isolation
- Direct messages and admin reply/delete
- Message isolation and soft-delete behaviour
- Current user profile lookup/update
- Profile photo upload success and invalid file rejection
- `passwordHash` response safety
- OpenAPI JSON validity and key path coverage
- Seed script documentation evidence

## Current Scope

Implemented:

- Express app/server separation
- Strict TypeScript configuration
- Prisma SQLite schema and seed data
- Environment validation with Zod
- CORS and Helmet setup
- Central error and 404 handling
- JWT authentication and RBAC
- Basic Auth evidence endpoint
- Public film browsing
- Admin film CRUD and OMDB import
- User favourites, watchlist, and watched records
- User/admin direct messages
- Authenticated user profile and profile photo upload
- OpenAPI documentation
- Jest and Supertest tests

Not implemented in this backend repository:

- React frontend integration
