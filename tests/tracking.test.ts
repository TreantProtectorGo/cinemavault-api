import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { createAdminAndGetToken, registerUserAndGetToken } from "./testUtils.js";

const adminPayload = {
  email: "tracking-admin@example.com",
  username: "trackingadmin",
  password: "AdminPassword123!"
};

const userAPayload = {
  email: "tracking-a@example.com",
  username: "trackinga",
  password: "UserPassword123!"
};

const userBPayload = {
  email: "tracking-b@example.com",
  username: "trackingb",
  password: "UserPassword123!"
};

const filmPayload = {
  title: "Arrival",
  genre: "Sci-Fi",
  year: 2016,
  rating: 7.9,
  director: "Denis Villeneuve",
  cast: "Amy Adams, Jeremy Renner, Forest Whitaker",
  plot: "A linguist works with the military to communicate with aliens.",
  runtime: 116,
  language: "English",
  country: "USA",
  imdbId: "tt2543164",
  isLive: true
};

async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.film.deleteMany();
  await prisma.user.deleteMany();
}

async function createFilm(token: string) {
  const response = await request(app)
    .post("/api/v1/films")
    .set("Authorization", `Bearer ${token}`)
    .send(filmPayload);

  return response.body as { id: string };
}

describe("Tracking API", () => {
  let adminToken: string;
  let userAToken: string;
  let userBToken: string;
  let filmId: string;

  beforeEach(async () => {
    await clearDatabase();

    adminToken = await createAdminAndGetToken(adminPayload);
    userAToken = await registerUserAndGetToken(userAPayload);
    userBToken = await registerUserAndGetToken(userBPayload);
    filmId = (await createFilm(adminToken)).id;
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  it("GET /api/v1/favourites without token returns 401", async () => {
    const response = await request(app).get("/api/v1/favourites");

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/favourites/:filmId with valid user token returns 201 or 200", async () => {
    const response = await request(app)
      .post(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect([200, 201]).toContain(response.status);
    expect(response.body).toMatchObject({
      filmId,
      links: {
        film: `/api/v1/films/${filmId}`,
        remove: `/api/v1/favourites/${filmId}`,
        collection: "/api/v1/favourites"
      }
    });
  });

  it("POST /api/v1/favourites/:filmId duplicate does not create duplicate", async () => {
    await request(app)
      .post(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const duplicateResponse = await request(app)
      .post(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const listResponse = await request(app)
      .get("/api/v1/favourites")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(duplicateResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it("DELETE /api/v1/favourites/:filmId removes favourite", async () => {
    await request(app)
      .post(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const deleteResponse = await request(app)
      .delete(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const listResponse = await request(app)
      .get("/api/v1/favourites")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("POST /api/v1/favourites/:filmId with missing film returns 404", async () => {
    const response = await request(app)
      .post("/api/v1/favourites/clw0000000000000000000000")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /api/v1/watchlist without token returns 401", async () => {
    const response = await request(app).get("/api/v1/watchlist");

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/watchlist/:filmId with valid user token returns 201 or 200", async () => {
    const response = await request(app)
      .post(`/api/v1/watchlist/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect([200, 201]).toContain(response.status);
    expect(response.body).toMatchObject({
      filmId,
      links: {
        film: `/api/v1/films/${filmId}`,
        remove: `/api/v1/watchlist/${filmId}`,
        collection: "/api/v1/watchlist"
      }
    });
  });

  it("DELETE /api/v1/watchlist/:filmId removes item", async () => {
    await request(app)
      .post(`/api/v1/watchlist/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const deleteResponse = await request(app)
      .delete(`/api/v1/watchlist/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const listResponse = await request(app)
      .get("/api/v1/watchlist")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("GET /api/v1/watched without token returns 401", async () => {
    const response = await request(app).get("/api/v1/watched");

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/watched/:filmId with valid body returns 201 or 200", async () => {
    const response = await request(app)
      .post(`/api/v1/watched/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        rating: 9,
        notes: "Strong first contact story."
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body).toMatchObject({
      filmId,
      rating: 9,
      notes: "Strong first contact story.",
      links: {
        film: `/api/v1/films/${filmId}`,
        remove: `/api/v1/watched/${filmId}`,
        collection: "/api/v1/watched"
      }
    });
  });

  it("POST /api/v1/watched/:filmId invalid body returns 400", async () => {
    const response = await request(app)
      .post(`/api/v1/watched/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        rating: 11
      });

    expect(response.status).toBe(400);
  });

  it("DELETE /api/v1/watched/:filmId removes watched record", async () => {
    await request(app)
      .post(`/api/v1/watched/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ rating: 8 });

    const deleteResponse = await request(app)
      .delete(`/api/v1/watched/${filmId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    const listResponse = await request(app)
      .get("/api/v1/watched")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("confirms user A cannot see user B's tracking records", async () => {
    await request(app)
      .post(`/api/v1/favourites/${filmId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    await request(app)
      .post(`/api/v1/watchlist/${filmId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    await request(app)
      .post(`/api/v1/watched/${filmId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ rating: 7 });

    const favouritesResponse = await request(app)
      .get("/api/v1/favourites")
      .set("Authorization", `Bearer ${userAToken}`);
    const watchlistResponse = await request(app)
      .get("/api/v1/watchlist")
      .set("Authorization", `Bearer ${userAToken}`);
    const watchedResponse = await request(app)
      .get("/api/v1/watched")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(favouritesResponse.body.data).toHaveLength(0);
    expect(watchlistResponse.body.data).toHaveLength(0);
    expect(watchedResponse.body.data).toHaveLength(0);
  });
});
