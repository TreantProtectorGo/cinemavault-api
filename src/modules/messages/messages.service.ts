import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type {
  CreateMessageInput,
  MessageQueryInput,
  ReplyMessageInput
} from "./messages.schemas.js";

type AuthenticatedUser = {
  id: string;
  role: string;
};

type MessageRecord = Awaited<ReturnType<typeof listMessageRecords>>[number];

export class MessageError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

function userSummary(user: MessageRecord["user"] | MessageRecord["admin"]) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    profilePhotoUrl: user.profilePhotoUrl
  };
}

function messageLinks(id: string, filmId: string, userId: string) {
  return {
    self: `/api/v1/messages/${id}`,
    film: `/api/v1/films/${filmId}`,
    sender: `/api/v1/users/${userId}`,
    reply: `/api/v1/admin/messages/${id}/reply`,
    delete: `/api/v1/admin/messages/${id}`
  };
}

function formatMessage(message: MessageRecord) {
  return {
    id: message.id,
    userId: message.userId,
    filmId: message.filmId,
    adminId: message.adminId,
    subject: message.subject,
    body: message.body,
    replyBody: message.replyBody,
    status: message.status,
    repliedAt: message.repliedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    sender: userSummary(message.user),
    admin: userSummary(message.admin),
    film: message.film,
    links: messageLinks(message.id, message.filmId, message.userId)
  };
}

async function listMessageRecords(where: Prisma.MessageWhereInput) {
  return prisma.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      },
      admin: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      },
      film: true
    },
    orderBy: { createdAt: "desc" }
  });
}

async function getMessageRecord(id: string) {
  return prisma.message.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      },
      admin: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          displayName: true,
          profilePhotoUrl: true
        }
      },
      film: true
    }
  });
}

async function ensureFilmExists(filmId: string) {
  const film = await prisma.film.findUnique({
    where: { id: filmId },
    select: { id: true }
  });

  if (!film) {
    throw new MessageError("Film not found", 404);
  }
}

export async function listUserMessages(
  user: AuthenticatedUser,
  query: MessageQueryInput
) {
  const where = {
    ...(user.role.toUpperCase() === "ADMIN" ? {} : { userId: user.id }),
    deletedAt: null,
    ...(query.status ? { status: query.status } : {})
  };

  const messages = await listMessageRecords(where);

  return {
    data: messages.map(formatMessage),
    links: {
      self: "/api/v1/messages"
    }
  };
}

export async function createUserMessage(userId: string, input: CreateMessageInput) {
  await ensureFilmExists(input.filmId);

  const message = await prisma.message.create({
    data: {
      userId,
      filmId: input.filmId,
      subject: input.subject,
      body: input.body
    }
  });

  const record = await getMessageRecord(message.id);

  if (!record) {
    throw new MessageError("Message not found", 404);
  }

  return formatMessage(record);
}

export async function listAdminMessages(query: MessageQueryInput) {
  const messages = await listMessageRecords({
    ...(query.status ? { status: query.status } : {})
  });

  return {
    data: messages.map(formatMessage),
    links: {
      self: "/api/v1/admin/messages"
    }
  };
}

export async function replyToMessage(
  id: string,
  adminId: string,
  input: ReplyMessageInput
) {
  const existing = await prisma.message.findUnique({
    where: { id },
    select: { id: true, deletedAt: true }
  });

  if (!existing || existing.deletedAt) {
    throw new MessageError("Message not found", 404);
  }

  const message = await prisma.message.update({
    where: { id },
    data: {
      adminId,
      replyBody: input.replyBody,
      status: "REPLIED",
      repliedAt: new Date()
    }
  });

  const record = await getMessageRecord(message.id);

  if (!record) {
    throw new MessageError("Message not found", 404);
  }

  return formatMessage(record);
}

export async function deleteMessage(id: string) {
  const existing = await prisma.message.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw new MessageError("Message not found", 404);
  }

  const message = await prisma.message.update({
    where: { id },
    data: {
      status: "DELETED",
      deletedAt: new Date()
    }
  });

  const record = await getMessageRecord(message.id);

  if (!record) {
    throw new MessageError("Message not found", 404);
  }

  return formatMessage(record);
}
