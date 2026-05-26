import { prisma } from "../../db/prisma.js";
import type { WatchedBodyInput } from "./watched.schemas.js";

export class WatchedError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

type WatchedRecordWithFilm = Awaited<ReturnType<typeof listWatchedRecords>>[number];

function trackingLinks(collection: string, filmId: string, recordId: string) {
  return {
    self: `${collection}/${recordId}`,
    film: `/api/v1/films/${filmId}`,
    remove: `${collection}/${filmId}`,
    collection
  };
}

function formatWatchedRecord(record: WatchedRecordWithFilm) {
  return {
    id: record.id,
    userId: record.userId,
    filmId: record.filmId,
    watchedAt: record.watchedAt.toISOString(),
    rating: record.rating,
    notes: record.reviewNote,
    film: record.film,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    links: trackingLinks("/api/v1/watched", record.filmId, record.id)
  };
}

async function listWatchedRecords(userId: string) {
  return prisma.watchedRecord.findMany({
    where: { userId },
    include: { film: true },
    orderBy: { watchedAt: "desc" }
  });
}

async function ensureFilmExists(filmId: string) {
  const film = await prisma.film.findUnique({
    where: { id: filmId },
    select: { id: true }
  });

  if (!film) {
    throw new WatchedError("Film not found", 404);
  }
}

export async function listWatched(userId: string) {
  const records = await listWatchedRecords(userId);

  return {
    data: records.map(formatWatchedRecord),
    links: {
      self: "/api/v1/watched"
    }
  };
}

export async function addWatchedRecord(
  userId: string,
  filmId: string,
  input: WatchedBodyInput
) {
  await ensureFilmExists(filmId);

  const existing = await prisma.watchedRecord.findUnique({
    where: {
      userId_filmId: { userId, filmId }
    },
    include: { film: true }
  });

  if (existing) {
    const record = await prisma.watchedRecord.update({
      where: {
        userId_filmId: { userId, filmId }
      },
      data: {
        rating: input.rating,
        reviewNote: input.notes,
        watchedAt: new Date()
      },
      include: { film: true }
    });

    return {
      created: false,
      record: formatWatchedRecord(record)
    };
  }

  const record = await prisma.watchedRecord.create({
    data: {
      userId,
      filmId,
      rating: input.rating,
      reviewNote: input.notes
    },
    include: { film: true }
  });

  return {
    created: true,
    record: formatWatchedRecord(record)
  };
}

export async function removeWatchedRecord(userId: string, filmId: string) {
  await prisma.watchedRecord.deleteMany({
    where: { userId, filmId }
  });

  return {
    status: "removed",
    filmId,
    links: {
      film: `/api/v1/films/${filmId}`,
      collection: "/api/v1/watched"
    }
  };
}
