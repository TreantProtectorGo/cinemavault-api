import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/db/prisma.js";

type TestUserPayload = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

export async function registerUserAndGetToken(payload: TestUserPayload) {
  const response = await request(app).post("/api/v1/auth/register").send(payload);

  return response.body.token as string;
}

export async function createAdminAndGetToken(payload: TestUserPayload) {
  await prisma.user.create({
    data: {
      email: payload.email,
      username: payload.username,
      passwordHash: await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS),
      role: "ADMIN",
      displayName: payload.displayName
    }
  });

  const response = await request(app).post("/api/v1/auth/login").send({
    emailOrUsername: payload.email,
    password: payload.password
  });

  return response.body.token as string;
}
