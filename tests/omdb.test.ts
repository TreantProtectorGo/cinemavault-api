import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { createAdminAndGetToken, registerUserAndGetToken } from "./testUtils.js";

const adminPayload = {
  email: "omdb-admin@example.com",
  username: "omdbadmin",
  password: "AdminPassword123!"
};

const userPayload = {
  email: "omdb-user@example.com",
  username: "omdbuser",
  password: "UserPassword123!"
};

const omdbFilm = {
  Response: "True",
  Title: "The Matrix",
  Year: "1999",
  Genre: "Action, Sci-Fi",
  Director: "Lana Wachowski, Lilly Wachowski",
  Actors: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss",
  Plot: "A computer hacker learns about the true nature of reality.",
  Poster: "https://example.com/matrix.jpg",
  Runtime: "136 min",
  Language: "English",
  Country: "United States",
  imdbID: "tt0133093",
  imdbRating: "8.7"
};

async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.film.deleteMany();
  await prisma.user.deleteMany();
}

function mockOmdbJson(body: Record<string, unknown>, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    })
  );
}

describe("OMDB film import", () => {
  const fetchMock = jest.spyOn(globalThis, "fetch");
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    await clearDatabase();
    fetchMock.mockReset();

    adminToken = await createAdminAndGetToken(adminPayload);
    userToken = await registerUserAndGetToken(userPayload);
  });

  afterAll(async () => {
    fetchMock.mockRestore();
    await clearDatabase();
    await prisma.$disconnect();
  });

  it("allows an admin to import a film from a mocked OMDB response", async () => {
    fetchMock.mockResolvedValueOnce(await mockOmdbJson(omdbFilm));

    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ imdbId: "tt0133093" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "The Matrix",
      year: 1999,
      genre: "Action, Sci-Fi",
      runtime: 136,
      imdbId: "tt0133093",
      rating: 8.7,
      isLive: true
    });
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.omdbMetadataJson).toContain("The Matrix");

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("apikey")).toBe("test-omdb-key");
    expect(calledUrl.searchParams.get("i")).toBe("tt0133093");
  });

  it("blocks a normal user from importing OMDB films", async () => {
    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ imdbId: "tt0133093" });

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when importing without a token", async () => {
    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .send({ imdbId: "tt0133093" });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates that imdbId or title is supplied", async () => {
    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when OMDB cannot find the film", async () => {
    fetchMock.mockResolvedValueOnce(
      await mockOmdbJson({
        Response: "False",
        Error: "Movie not found!"
      })
    );

    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Definitely Missing Film" });

    expect(response.status).toBe(404);
  });

  it("returns 502 when the OMDB request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));

    const response = await request(app)
      .post("/api/v1/films/import-omdb")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ imdbId: "tt0133093" });

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("OMDB API request failed");
  });
});
