import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";

const userPayload = {
  email: "profile-member@example.com",
  username: "profilemember",
  password: "StrongPassword123!",
  displayName: "Profile Member"
};

const avatarDirectory = path.resolve(process.cwd(), "uploads", "avatars");

async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.watchedRecord.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.film.deleteMany();
  await prisma.user.deleteMany();
}

async function clearUploadedAvatars() {
  await fs.mkdir(avatarDirectory, { recursive: true });
  const files = await fs.readdir(avatarDirectory);

  await Promise.all(
    files
      .filter((file) => file !== ".gitkeep")
      .map((file) => fs.rm(path.join(avatarDirectory, file), { force: true }))
  );
}

async function registerAndGetToken() {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send(userPayload);

  return response.body.token as string;
}

describe("Current user profile", () => {
  beforeEach(async () => {
    await clearDatabase();
    await clearUploadedAvatars();
  });

  afterAll(async () => {
    await clearDatabase();
    await clearUploadedAvatars();
    await prisma.$disconnect();
  });

  it("returns 401 for GET /me without a token", async () => {
    const response = await request(app).get("/api/v1/me");

    expect(response.status).toBe(401);
  });

  it("returns the current public user profile with a valid token", async () => {
    const token = await registerAndGetToken();

    const response = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: userPayload.email,
      username: userPayload.username,
      role: "USER",
      displayName: userPayload.displayName
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it("never exposes passwordHash from GET /me", async () => {
    const token = await registerAndGetToken();

    const response = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("updates safe current user profile fields only", async () => {
    const token = await registerAndGetToken();

    const response = await request(app)
      .put("/api/v1/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Updated Profile Member",
        profilePhotoUrl: "https://example.com/avatar.png"
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      displayName: "Updated Profile Member",
      profilePhotoUrl: "https://example.com/avatar.png",
      role: "USER"
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("does not allow profile updates to change role", async () => {
    const token = await registerAndGetToken();

    const response = await request(app)
      .put("/api/v1/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        role: "ADMIN"
      });

    expect(response.status).toBe(400);
  });

  it("returns 401 for profile photo upload without a token", async () => {
    const response = await request(app)
      .post("/api/v1/me/profile-photo")
      .attach("profilePhoto", Buffer.from("not authenticated"), {
        filename: "avatar.png",
        contentType: "image/png"
      });

    expect(response.status).toBe(401);
  });

  it("rejects invalid profile photo file types", async () => {
    const token = await registerAndGetToken();

    const response = await request(app)
      .post("/api/v1/me/profile-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", Buffer.from("not an image"), {
        filename: "avatar.txt",
        contentType: "text/plain"
      });

    expect(response.status).toBe(400);
  });

  it("accepts a valid profile photo upload and returns the updated public user", async () => {
    const token = await registerAndGetToken();
    const pngPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    );

    const response = await request(app)
      .post("/api/v1/me/profile-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", pngPixel, {
        filename: "avatar.png",
        contentType: "image/png"
      });

    expect(response.status).toBe(200);
    expect(response.body.profilePhotoUrl).toMatch(/^\/uploads\/avatars\//);
    expect(response.body.passwordHash).toBeUndefined();

    const staticResponse = await request(app).get(response.body.profilePhotoUrl);
    expect(staticResponse.status).toBe(200);
  });
});
