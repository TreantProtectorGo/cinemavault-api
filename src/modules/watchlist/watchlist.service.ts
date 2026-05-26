import { prisma } from "../../db/prisma.js";

export class WatchlistError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

type WatchlistRecord = Awaited<ReturnType<typeof listWatchlistRecords>>[number];

function trackingLinks(collection: string, filmId: string, recordId: string) {
  return {
    self: `${collection}/${recordId}`,
    film: `/api/v1/films/${filmId}`,
    remove: `${collection}/${filmId}`,
    collection
  };
}

function formatWatchlistItem(record: WatchlistRecord) {
  return {
    id: record.id,
    userId: record.userId,
    filmId: record.filmId,
    status: record.status,
    notes: record.notes,
    film: record.film,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    links: trackingLinks("/api/v1/watchlist", record.filmId, record.id)
  };
}

async function listWatchlistRecords(userId: string) {
  return prisma.watchlistItem.findMany({
    where: { userId },
    include: { film: true },
    orderBy: { createdAt: "desc" }
  });
}

async function ensureFilmExists(filmId: string) {
  const film = await prisma.film.findUnique({
    where: { id: filmId },
    select: { id: true }
  });

  if (!film) {
    throw new WatchlistError("Film not found", 404);
  }
}

export async function listWatchlist(userId: string) {
  const records = await listWatchlistRecords(userId);

  return {
    data: records.map(formatWatchlistItem),
    links: {
      self: "/api/v1/watchlist"
    }
  };
}

export async function addWatchlistItem(userId: string, filmId: string) {
  await ensureFilmExists(filmId);

  const existing = await prisma.watchlistItem.findUnique({
    where: {
      userId_filmId: { userId, filmId }
    },
    include: { film: true }
  });

  if (existing) {
    return {
      created: false,
      record: formatWatchlistItem(existing)
    };
  }

  const record = await prisma.watchlistItem.create({
    data: { userId, filmId },
    include: { film: true }
  });

  return {
    created: true,
    record: formatWatchlistItem(record)
  };
}

export async function removeWatchlistItem(userId: string, filmId: string) {
  await prisma.watchlistItem.deleteMany({
    where: { userId, filmId }
  });

  return {
    status: "removed",
    filmId,
    links: {
      film: `/api/v1/films/${filmId}`,
      collection: "/api/v1/watchlist"
    }
  };
}
