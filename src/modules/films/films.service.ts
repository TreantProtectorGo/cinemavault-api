import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type {
  CreateFilmInput,
  FilmQueryInput,
  UpdateFilmInput
} from "./films.schemas.js";

type FilmRecord = {
  id: string;
  title: string;
  genre: string | null;
  year: number | null;
  rating: number | null;
  director: string | null;
  cast: string | null;
  plot: string | null;
  posterUrl: string | null;
  runtime: number | null;
  language: string | null;
  country: string | null;
  imdbId: string | null;
  omdbMetadataJson: string | null;
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class FilmError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

function filmLinks(id: string) {
  return {
    self: `/api/v1/films/${id}`,
    collection: "/api/v1/films",
    favourite: `/api/v1/favourites/${id}`,
    watchlist: `/api/v1/watchlist/${id}`
  };
}

export function formatFilm(film: FilmRecord) {
  return {
    id: film.id,
    title: film.title,
    genre: film.genre,
    year: film.year,
    rating: film.rating,
    director: film.director,
    cast: film.cast,
    plot: film.plot,
    posterUrl: film.posterUrl,
    runtime: film.runtime,
    language: film.language,
    country: film.country,
    imdbId: film.imdbId,
    omdbMetadataJson: film.omdbMetadataJson,
    isLive: film.isLive,
    createdAt: film.createdAt.toISOString(),
    updatedAt: film.updatedAt.toISOString(),
    links: filmLinks(film.id)
  };
}

function buildWhere(query: FilmQueryInput): Prisma.FilmWhereInput {
  const where: Prisma.FilmWhereInput = {
    isLive: query.isLive ?? true
  };

  if (query.title) {
    where.title = {
      contains: query.title
    };
  }

  if (query.genre) {
    where.genre = {
      contains: query.genre
    };
  }

  if (query.year !== undefined) {
    where.year = query.year;
  }

  if (query.rating !== undefined) {
    where.rating = query.rating;
  }

  return where;
}

export async function listFilms(query: FilmQueryInput) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [films, total] = await prisma.$transaction([
    prisma.film.findMany({
      where,
      orderBy: {
        [query.sortBy]: query.order
      },
      skip,
      take: query.limit
    }),
    prisma.film.count({ where })
  ]);

  return {
    data: films.map(formatFilm),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    },
    links: {
      self: "/api/v1/films"
    }
  };
}

export async function getFilmById(id: string) {
  const film = await prisma.film.findUnique({
    where: { id }
  });

  if (!film) {
    throw new FilmError("Film not found", 404);
  }

  return formatFilm(film);
}

export async function createFilm(input: CreateFilmInput) {
  try {
    const film = await prisma.film.create({
      data: input
    });

    return formatFilm(film);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new FilmError("Film with this unique field already exists", 409);
    }

    throw error;
  }
}

export async function updateFilm(id: string, input: UpdateFilmInput) {
  try {
    const film = await prisma.film.update({
      where: { id },
      data: input
    });

    return formatFilm(film);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new FilmError("Film not found", 404);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new FilmError("Film with this unique field already exists", 409);
    }

    throw error;
  }
}

export async function deleteFilm(id: string) {
  try {
    const film = await prisma.film.update({
      where: { id },
      data: {
        isLive: false
      }
    });

    return formatFilm(film);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new FilmError("Film not found", 404);
    }

    throw error;
  }
}
