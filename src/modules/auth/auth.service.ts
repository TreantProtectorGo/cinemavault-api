import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import type { GoogleAuthInput, LoginInput, RegisterInput } from "./auth.schemas.js";
import { verifyGoogleCredential } from "./googleVerifier.js";

type UserRecord = {
  id: string;
  email: string;
  username: string;
  role: string;
  displayName?: string | null;
  profilePhotoUrl?: string | null;
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
    role: user.role,
    displayName: user.displayName,
    profilePhotoUrl: user.profilePhotoUrl
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
      role: "USER",
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

async function generateUniqueUsername(email: string) {
  const baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24) || "google-user";

  let candidate = baseUsername;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    counter += 1;
    candidate = `${baseUsername.slice(0, 24)}-${counter}`;
  }

  return candidate;
}

export async function loginWithGoogle(input: GoogleAuthInput) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AuthError("Google OAuth is not configured", 500);
  }

  let profile;

  try {
    profile = await verifyGoogleCredential(input.credential);
  } catch {
    throw new AuthError("Invalid Google credential", 401);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email }
  });

  if (existingUser?.role.toUpperCase() === "ADMIN") {
    throw new AuthError(
      "External authentication cannot be used for administrator accounts",
      403
    );
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          displayName: existingUser.displayName ?? profile.name,
          profilePhotoUrl: existingUser.profilePhotoUrl ?? profile.picture
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      })
    : await prisma.user.create({
        data: {
          email: profile.email,
          username: await generateUniqueUsername(profile.email),
          passwordHash: await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            env.BCRYPT_SALT_ROUNDS
          ),
          role: "USER",
          displayName: profile.name,
          profilePhotoUrl: profile.picture
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      });

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
