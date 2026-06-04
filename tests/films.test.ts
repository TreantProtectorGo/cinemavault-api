import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { createAdminAndGetToken, registerUserAndGetToken } from "./testUtils.js";

const adminPayload = {
  email: "film-admin@example.com",
  username: "filmadmin",
  password: "AdminPassword123!"
};

const userPayload = {
  email: "film-user@example.com",
  username: "filmuser",
  password: "UserPassword123!"
};

const inceptionPayload = {
  title: "Inception",
  genre: "Sci-Fi",
  year: 2010,
  rating: 8.8,
  director: "Christopher Nolan",
  cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
  plot: "A thief enters dreams to steal secrets.",
  posterUrl: "https://example.com/inception.jpg",
  runtime: 148,
  language: "English",
  country: "USA",
  imdbId: "tt1375666",
  omdbMetadataJson: "{\"source\":\"test\"}",
  isLive: true
};

const batmanPayload = {
  title: "Batman: The Dark Knight",
  genre: "Action",
  year: 2008,
  rating: 9.0,
  director: "Christopher Nolan",
  cast: "Christian Bale, Heath Ledger, Aaron Eckhart",
  plot: "Batman faces the Joker in Gotham.",
  posterUrl: "https://example.com/dark-knight.jpg",
  runtime: 152,
  language: "English",
  country: "USA",
  imdbId: "tt0468569",
  isLive: true
};

const hiddenPayload = {
  title: "Hidden Archive Film",
  genre: "Drama",
  year: 1999,
  rating: 6.5,
  director: "Archive Director",
  cast: "Archive Cast",
  plot: "A non-live film.",
  runtime: 100,
  language: "English",
  country: "UK",
  imdbId: "tt0000001",
  isLive: false
};

async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.film.deleteMany();
  await prisma.user.deleteMany();
}

async function createFilm(token: string, payload: Record<string, unknown>) {
  const response = await request(app)
    .post("/api/v1/films")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return response.body;
}

describe("Films API", () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    await clearDatabase();
    adminToken = await createAdminAndGetToken(adminPayload);
    userToken = await registerUserAndGetToken(userPayload);
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  it("public GET /api/v1/films returns 200", async () => {
    await createFilm(adminToken, inceptionPayload);

    const response = await request(app).get("/api/v1/films");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      title: "Inception",
      links: {
        collection: "/api/v1/films"
      }
    });
  });

  it("public GET /api/v1/films supports title search", async () => {
    await createFilm(adminToken, inceptionPayload);
    await createFilm(adminToken, batmanPayload);

    const response = await request(app).get("/api/v1/films?title=batman");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Batman: The Dark Knight");
  });

  it("public GET /api/v1/films supports genre filter", async () => {
    await createFilm(adminToken, inceptionPayload);
    await createFilm(adminToken, batmanPayload);

    const response = await request(app).get("/api/v1/films?genre=Action");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].genre).toBe("Action");
  });

  it("public GET /api/v1/films supports year filter", async () => {
    await createFilm(adminToken, inceptionPayload);
    await createFilm(adminToken, batmanPayload);

    const response = await request(app).get("/api/v1/films?year=2008");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].year).toBe(2008);
  });

  it("public GET /api/v1/films supports minimum rating filter", async () => {
    await createFilm(adminToken, inceptionPayload);
    await createFilm(adminToken, batmanPayload);
    await createFilm(adminToken, hiddenPayload);

    const response = await request(app).get("/api/v1/films?rating=8.8");

    expect(response.status).toBe(200);
    expect(response.body.data.map((film: { title: string }) => film.title)).toEqual([
      "Inception",
      "Batman: The Dark Knight"
    ]);
  });

  it("public GET /api/v1/films supports sorting", async () => {
    await createFilm(adminToken, inceptionPayload);
    await createFilm(adminToken, batmanPayload);

    const response = await request(app).get("/api/v1/films?sortBy=rating&order=desc");

    expect(response.status).toBe(200);
    expect(response.body.data.map((film: { title: string }) => film.title)).toEqual([
      "Batman: The Dark Knight",
      "Inception"
    ]);
  });

  it("public GET /api/v1/films with invalid query params returns 400", async () => {
    const response = await request(app).get("/api/v1/films?year=not-a-year");

    expect(response.status).toBe(400);
  });

  it("public GET /api/v1/films/:id returns one film", async () => {
    const film = await createFilm(adminToken, inceptionPayload);

    const response = await request(app).get(`/api/v1/films/${film.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: film.id,
      title: "Inception",
      links: {
        self: `/api/v1/films/${film.id}`,
        collection: "/api/v1/films",
        favourite: `/api/v1/favourites/${film.id}`,
        watchlist: `/api/v1/watchlist/${film.id}`
      }
    });
  });

  it("public GET /api/v1/films/:id includes conditional request headers", async () => {
    const film = await createFilm(adminToken, inceptionPayload);

    const response = await request(app).get(`/api/v1/films/${film.id}`);

    expect(response.status).toBe(200);
    expect(response.headers.etag).toEqual(expect.any(String));
    expect(response.headers["last-modified"]).toEqual(expect.any(String));
    expect(response.body.title).toBe("Inception");
  });

  it("public GET /api/v1/films/:id returns 304 when If-None-Match matches", async () => {
    const film = await createFilm(adminToken, inceptionPayload);

    const firstResponse = await request(app).get(`/api/v1/films/${film.id}`);
    const secondResponse = await request(app)
      .get(`/api/v1/films/${film.id}`)
      .set("If-None-Match", firstResponse.headers.etag);

    expect(secondResponse.status).toBe(304);
    expect(secondResponse.text).toBe("");
  });

  it("public GET /api/v1/films/:id with missing film returns 404", async () => {
    const response = await request(app).get("/api/v1/films/clw0000000000000000000000");

    expect(response.status).toBe(404);
  });

  it("POST /api/v1/films without token returns 401", async () => {
    const response = await request(app).post("/api/v1/films").send(inceptionPayload);

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/films with user token returns 403", async () => {
    const response = await request(app)
      .post("/api/v1/films")
      .set("Authorization", `Bearer ${userToken}`)
      .send(inceptionPayload);

    expect(response.status).toBe(403);
  });

  it("POST /api/v1/films with admin token returns 201", async () => {
    const response = await request(app)
      .post("/api/v1/films")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(inceptionPayload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Inception",
      year: 2010,
      rating: 8.8,
      links: {
        collection: "/api/v1/films"
      }
    });
  });

  it("POST /api/v1/films with invalid body returns 400", async () => {
    const response = await request(app)
      .post("/api/v1/films")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "" });

    expect(response.status).toBe(400);
  });

  it("PUT /api/v1/films/:id with admin token returns 200", async () => {
    const film = await createFilm(adminToken, inceptionPayload);

    const response = await request(app)
      .put(`/api/v1/films/${film.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Inception: Restored",
        rating: 8.9
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: film.id,
      title: "Inception: Restored",
      rating: 8.9
    });
  });

  it("DELETE /api/v1/films/:id with admin token returns 200", async () => {
    const film = await createFilm(adminToken, hiddenPayload);

    const response = await request(app)
      .delete(`/api/v1/films/${film.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: film.id,
      isLive: false
    });
  });
});
