import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type UserRecord = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
}

function signToken(user: UserRecord) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN
  };

  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    env.JWT_SECRET,
    options
  );
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }]
    }
  });

  if (existingUser) {
    throw new AuthError("Email or username already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      role: input.role,
      displayName: input.displayName
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true
    }
  });

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

export async function loginUser(input: LoginInput) {
  const identifier = input.emailOrUsername.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: input.emailOrUsername }]
    }
  });

  if (!user) {
    throw new AuthError("Invalid email/username or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("Invalid email/username or password", 401);
  }

  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

export async function verifyBasicCredentials(identifier: string, password: string) {
  const normalizedIdentifier = identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { username: identifier }]
    }
  });

  if (!user) {
    throw new AuthError("Invalid Basic Auth credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("Invalid Basic Auth credentials", 401);
  }

  return publicUser(user);
}
