import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";

const adminPayload = {
  email: "messages-admin@example.com",
  username: "messagesadmin",
  password: "AdminPassword123!",
  role: "ADMIN"
};

const userAPayload = {
  email: "messages-a@example.com",
  username: "messagesa",
  password: "UserPassword123!"
};

const userBPayload = {
  email: "messages-b@example.com",
  username: "messagesb",
  password: "UserPassword123!"
};

const filmPayload = {
  title: "Interstellar",
  genre: "Sci-Fi",
  year: 2014,
  rating: 8.7,
  director: "Christopher Nolan",
  cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
  plot: "Explorers travel through a wormhole in space.",
  runtime: 169,
  language: "English",
  country: "USA",
  imdbId: "tt0816692",
  isLive: true
};

function messagePayload(filmId: string) {
  return {
    filmId,
    subject: "Screening question",
    body: "Will this film be available in the weekend showcase?"
  };
}

async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.film.deleteMany();
  await prisma.user.deleteMany();
}

async function registerAndGetToken(payload: Record<string, unknown>) {
  const response = await request(app).post("/api/v1/auth/register").send(payload);

  return response.body.token as string;
}

async function createFilm(token: string) {
  const response = await request(app)
    .post("/api/v1/films")
    .set("Authorization", `Bearer ${token}`)
    .send(filmPayload);

  return response.body as { id: string };
}

async function createMessage(token: string, filmId: string) {
  const response = await request(app)
    .post("/api/v1/messages")
    .set("Authorization", `Bearer ${token}`)
    .send(messagePayload(filmId));

  return response.body as { id: string };
}

describe("Messages API", () => {
  let adminToken: string;
  let userAToken: string;
  let userBToken: string;
  let filmId: string;

  beforeEach(async () => {
    await clearDatabase();

    adminToken = await registerAndGetToken(adminPayload);
    userAToken = await registerAndGetToken(userAPayload);
    userBToken = await registerAndGetToken(userBPayload);
    filmId = (await createFilm(adminToken)).id;
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  it("GET /api/v1/messages without token returns 401", async () => {
    const response = await request(app).get("/api/v1/messages");

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/messages without token returns 401", async () => {
    const response = await request(app).post("/api/v1/messages").send(messagePayload(filmId));

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/messages with valid user token returns 201", async () => {
    const response = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${userAToken}`)
      .send(messagePayload(filmId));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      filmId,
      subject: "Screening question",
      body: "Will this film be available in the weekend showcase?",
      status: "OPEN",
      links: {
        self: `/api/v1/messages/${response.body.id}`,
        film: `/api/v1/films/${filmId}`,
        reply: `/api/v1/admin/messages/${response.body.id}/reply`,
        delete: `/api/v1/admin/messages/${response.body.id}`
      }
    });
    expect(response.body.sender.passwordHash).toBeUndefined();
  });

  it("POST /api/v1/messages with missing film returns 404", async () => {
    const response = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${userAToken}`)
      .send(messagePayload("clw0000000000000000000000"));

    expect(response.status).toBe(404);
  });

  it("POST /api/v1/messages with invalid body returns 400", async () => {
    const response = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        filmId,
        subject: "",
        body: ""
      });

    expect(response.status).toBe(400);
  });

  it("User A cannot see User B's messages", async () => {
    await createMessage(userBToken, filmId);

    const response = await request(app)
      .get("/api/v1/messages")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  it("GET /api/v1/admin/messages without token returns 401", async () => {
    const response = await request(app).get("/api/v1/admin/messages");

    expect(response.status).toBe(401);
  });

  it("GET /api/v1/admin/messages with user token returns 403", async () => {
    const response = await request(app)
      .get("/api/v1/admin/messages")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(403);
  });

  it("GET /api/v1/admin/messages with admin token returns 200", async () => {
    await createMessage(userAToken, filmId);

    const response = await request(app)
      .get("/api/v1/admin/messages")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].sender.passwordHash).toBeUndefined();
  });

  it("POST /api/v1/admin/messages/:id/reply with user token returns 403", async () => {
    const message = await createMessage(userAToken, filmId);

    const response = await request(app)
      .post(`/api/v1/admin/messages/${message.id}/reply`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ replyBody: "Admin reply" });

    expect(response.status).toBe(403);
  });

  it("POST /api/v1/admin/messages/:id/reply with admin token returns 200", async () => {
    const message = await createMessage(userAToken, filmId);

    const response = await request(app)
      .post(`/api/v1/admin/messages/${message.id}/reply`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ replyBody: "Yes, it is scheduled for Saturday." });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: message.id,
      replyBody: "Yes, it is scheduled for Saturday.",
      status: "REPLIED"
    });
    expect(response.body.repliedAt).toEqual(expect.any(String));
  });

  it("POST /api/v1/admin/messages/:id/reply with invalid body returns 400", async () => {
    const message = await createMessage(userAToken, filmId);

    const response = await request(app)
      .post(`/api/v1/admin/messages/${message.id}/reply`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ replyBody: "" });

    expect(response.status).toBe(400);
  });

  it("DELETE /api/v1/admin/messages/:id with user token returns 403", async () => {
    const message = await createMessage(userAToken, filmId);

    const response = await request(app)
      .delete(`/api/v1/admin/messages/${message.id}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(403);
  });

  it("DELETE /api/v1/admin/messages/:id with admin token returns 200", async () => {
    const message = await createMessage(userAToken, filmId);

    const response = await request(app)
      .delete(`/api/v1/admin/messages/${message.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: message.id,
      status: "DELETED"
    });
  });

  it("deleted message does not appear in normal user list", async () => {
    const message = await createMessage(userAToken, filmId);

    await request(app)
      .delete(`/api/v1/admin/messages/${message.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const response = await request(app)
      .get("/api/v1/messages")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });
});
