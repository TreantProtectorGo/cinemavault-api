import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { UpdateProfileInput } from "./profile.schemas.js";

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  displayName: true,
  profilePhotoUrl: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

export class ProfileError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

export async function getCurrentUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect
  });

  if (!user) {
    throw new ProfileError("User not found", 404);
  }

  return user;
}

export async function updateCurrentUserProfile(
  userId: string,
  input: UpdateProfileInput
) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: publicUserSelect
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ProfileError("Email or username is already in use", 409);
      }

      if (error.code === "P2025") {
        throw new ProfileError("User not found", 404);
      }
    }

    throw error;
  }
}

export async function updateCurrentUserProfilePhoto(
  userId: string,
  profilePhotoUrl: string
) {
  return updateCurrentUserProfile(userId, { profilePhotoUrl });
}
