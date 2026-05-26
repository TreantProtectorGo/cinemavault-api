# CinemaVault API

CinemaVault API is the backend repository for the Coventry University 6003CEM Web API Development CW2 project.

This Phase 1 scaffold sets up a TypeScript-based REST API foundation using Express, Prisma, SQLite, and Zod. It does not implement the full feature set yet.

## Tech Stack

- Node.js 20+
- TypeScript
- Express
- Prisma ORM
- SQLite
- Zod
- bcrypt
- JWT

## Project Structure

```text
cinemavault-api/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
    config/
    db/
    middleware/
    modules/
    routes/
    types/
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Default local values:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
```

## Database

Validate the Prisma schema:

```bash
npx prisma validate
```

Create the SQLite database and initial migration:

```bash
npm run prisma:migrate -- --name init
```

Regenerate Prisma Client if needed:

```bash
npm run prisma:generate
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

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

Register an admin user for coursework RBAC verification:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "AdminPassword123!",
    "role": "ADMIN"
  }'
```

Login:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "member@example.com",
    "password": "StrongPassword123!"
  }'
```

Successful register and login responses include a JWT. Send it with protected requests:

```bash
Authorization: Bearer <token>
```

## Basic Auth Evidence

The main application authentication uses JWT. Basic Auth is included only as coursework/lab evidence and is not intended to replace the JWT flow used by the API client.

Basic Auth evidence endpoint:

```bash
curl http://localhost:4000/api/v1/auth/basic-check \
  -H "Authorization: Basic $(printf 'member:StrongPassword123!' | base64)"
```

The endpoint accepts `username:password` or `email:password`, checks the password against the stored bcrypt `passwordHash`, and never returns `passwordHash`.

Admin-only RBAC test endpoint:

```bash
curl http://localhost:4000/api/v1/admin/ping \
  -H "Authorization: Bearer <admin-token>"
```

Passwords are hashed with bcrypt before storage. Plain text passwords are never stored or returned by the API.

## Film Endpoints

Public film browsing routes:

```text
GET /api/v1/films
GET /api/v1/films/:id
```

Admin-only film mutation routes:

```text
POST /api/v1/films
PUT /api/v1/films/:id
DELETE /api/v1/films/:id
```

Public `GET` routes do not require a token. Admin-only mutation routes require a JWT bearer token for a user with the `ADMIN` role.

Example search/filter/sort request:

```bash
curl "http://localhost:4000/api/v1/films?title=batman&genre=Action&year=2008&sortBy=rating&order=desc&page=1&limit=10"
```

Supported query parameters for `GET /api/v1/films`:

- `title`
- `genre`
- `year`
- `rating`
- `isLive`
- `sortBy`
- `order`
- `page`
- `limit`

Film responses include HATEOAS-style links:

```json
{
  "id": "film-id",
  "title": "Inception",
  "links": {
    "self": "/api/v1/films/film-id",
    "collection": "/api/v1/films",
    "favourite": "/api/v1/favourites/film-id",
    "watchlist": "/api/v1/watchlist/film-id"
  }
}
```

## Testing

Run the Jest and Supertest suite:

```bash
npm test
```

Run tests in watch mode while developing:

```bash
npm run test:watch
```

Generate a coverage report:

```bash
npm run test:coverage
```

The test scripts run `prisma db push` against `file:./test.db` before Jest starts. Tests import the Express app directly and use `request(app)`, so they do not start the real HTTP server.

Current test coverage includes:

- Public health endpoint
- Registration success
- Duplicate email or username conflict
- Login success with JWT response
- Wrong password rejection
- Missing token rejection
- Invalid token rejection
- User role blocked from admin route
- Admin role allowed through admin route
- Basic Auth success
- Basic Auth missing header rejection
- Basic Auth wrong password rejection
- Basic Auth malformed header rejection
- Public films browsing
- Films title search
- Films genre/year/rating filters
- Films sorting and pagination support
- Public film detail lookup
- Film not found handling
- Admin-only film create/update/delete authorization
- Film request body, route param, and query validation

## Phase 1 Scope

Implemented in this scaffold:

- Express app/server separation
- Strict TypeScript configuration
- Environment validation with Zod
- JSON API defaults
- CORS and Helmet setup
- Central error handler
- 404 handler
- Prisma SQLite connection setup
- Jest, ts-jest, and Supertest testing scaffold
- JWT authentication and RBAC middleware
- Auth endpoints for register and login
- Basic Auth evidence endpoint
- Admin-only RBAC verification endpoint
- Public Film browsing and detail endpoints
- Admin-only Film create, update, and soft-delete endpoints
- Film search, filter, sort, pagination, validation, and HATEOAS-style links
- Initial database models:
  - `User`
  - `Film`
  - `Favourite`
  - `WatchlistItem`
  - `WatchedRecord`
  - `Message`
- Reserved module folders for later auth, RBAC, film CRUD, favourites, watchlist, watched records, messages, OpenAPI, testing, and frontend integration

Not implemented yet:

- Favourites/watchlist/watched endpoints
- Direct message endpoints
- OMDB API integration
- OpenAPI/Swagger documentation
- React frontend integration

## Later Coursework Phases

The scaffold is prepared for:

- Phase 2: Basic Auth evidence, JWT authentication, and `admin`/`user` RBAC
- Phase 3: public safe GET film browsing plus admin CRUD
- Phase 4: favourites, watchlist, watched records, and direct messages
- Phase 5: OMDB metadata import
- Phase 6: OpenAPI/Swagger documentation
- Phase 7: Jest and Supertest API endpoint tests
- Phase 8: React TypeScript SPA integration
