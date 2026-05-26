import { prisma } from "../../db/prisma.js";

export class FavouriteError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

type FavouriteRecord = Awaited<ReturnType<typeof listFavouriteRecords>>[number];

function trackingLinks(collection: string, filmId: string, recordId: string) {
  return {
    self: `${collection}/${recordId}`,
    film: `/api/v1/films/${filmId}`,
    remove: `${collection}/${filmId}`,
    collection
  };
}

function formatFavourite(record: FavouriteRecord) {
  return {
    id: record.id,
    userId: record.userId,
    filmId: record.filmId,
    film: record.film,
    createdAt: record.createdAt.toISOString(),
    links: trackingLinks("/api/v1/favourites", record.filmId, record.id)
  };
}

async function listFavouriteRecords(userId: string) {
  return prisma.favourite.findMany({
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
    throw new FavouriteError("Film not found", 404);
  }
}

export async function listFavourites(userId: string) {
  const records = await listFavouriteRecords(userId);

  return {
    data: records.map(formatFavourite),
    links: {
      self: "/api/v1/favourites"
    }
  };
}

export async function addFavourite(userId: string, filmId: string) {
  await ensureFilmExists(filmId);

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_filmId: { userId, filmId }
    },
    include: { film: true }
  });

  if (existing) {
    return {
      created: false,
      record: formatFavourite(existing)
    };
  }

  const record = await prisma.favourite.create({
    data: { userId, filmId },
    include: { film: true }
  });

  return {
    created: true,
    record: formatFavourite(record)
  };
}

export async function removeFavourite(userId: string, filmId: string) {
  await prisma.favourite.deleteMany({
    where: { userId, filmId }
  });

  return {
    status: "removed",
    filmId,
    links: {
      film: `/api/v1/films/${filmId}`,
      collection: "/api/v1/favourites"
    }
  };
}
