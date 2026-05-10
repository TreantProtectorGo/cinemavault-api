import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";

const userPayload = {
  email: "member@example.com",
  username: "member",
  password: "StrongPassword123!",
  displayName: "Cinema Member"
};

const adminPayload = {
  email: "admin@example.com",
  username: "admin",
  password: "AdminPassword123!",
  displayName: "Cinema Admin",
  role: "ADMIN"
};

async function clearUsers() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.user.deleteMany();
}

describe("Authentication and RBAC", () => {
  beforeEach(async () => {
    await clearUsers();
  });

  afterAll(async () => {
    await clearUsers();
    await prisma.$disconnect();
  });

  it("registers a new user and never returns the password hash", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userPayload);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: userPayload.email,
      username: userPayload.username,
      role: "USER"
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.token).toEqual(expect.any(String));

    const storedUser = await prisma.user.findUnique({
      where: { email: userPayload.email }
    });

    expect(storedUser?.passwordHash).toEqual(expect.any(String));
    expect(storedUser?.passwordHash).not.toBe(userPayload.password);
  });

  it("returns conflict when email or username already exists", async () => {
    await request(app).post("/api/v1/auth/register").send(userPayload);

    const duplicateEmail = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...userPayload, username: "another-user" });

    expect(duplicateEmail.status).toBe(409);

    const duplicateUsername = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...userPayload, email: "another@example.com" });

    expect(duplicateUsername.status).toBe(409);
  });

  it("logs in with valid credentials and returns a JWT", async () => {
    await request(app).post("/api/v1/auth/register").send(userPayload);

    const response = await request(app).post("/api/v1/auth/login").send({
      emailOrUsername: userPayload.email,
      password: userPayload.password
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: userPayload.email,
      username: userPayload.username,
      role: "USER"
    });
  });

  it("returns 401 for a wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send(userPayload);

    const response = await request(app).post("/api/v1/auth/login").send({
      emailOrUsername: userPayload.email,
      password: "WrongPassword123!"
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when a protected route has no token", async () => {
    const response = await request(app).get("/api/v1/admin/ping");

    expect(response.status).toBe(401);
  });

  it("returns 401 when a protected route has an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/admin/ping")
      .set("Authorization", "Bearer not-a-real-token");

    expect(response.status).toBe(401);
  });

  it("returns 403 when a user role accesses the admin route", async () => {
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(userPayload);

    const response = await request(app)
      .get("/api/v1/admin/ping")
      .set("Authorization", `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(403);
  });

  it("returns 200 when an admin role accesses the admin route", async () => {
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(adminPayload);

    const response = await request(app)
      .get("/api/v1/admin/ping")
      .set("Authorization", `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      role: "ADMIN"
    });
  });
});
