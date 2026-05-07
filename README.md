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

The Phase 1.5 testing scaffold includes a public health endpoint test in `tests/health.test.ts`. It imports the Express app directly and uses `request(app)`, so it does not start the real HTTP server.

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
- Initial database models:
  - `User`
  - `Film`
  - `Favourite`
  - `WatchlistItem`
  - `WatchedRecord`
  - `Message`
- Reserved module folders for later auth, RBAC, film CRUD, favourites, watchlist, watched records, messages, OpenAPI, testing, and frontend integration

Not implemented yet:

- Authentication
- Authorization and RBAC
- Film CRUD endpoints
- Search/filter/sort endpoints
- Favourites/watchlist/watched endpoints
- Direct message endpoints
- OMDB API integration
- OpenAPI/Swagger documentation
- Jest and Supertest tests
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
