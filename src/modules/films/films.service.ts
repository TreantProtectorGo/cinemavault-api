import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { publishFilmMadeLive } from "../social/socialPublisher.js";
import { normaliseOmdbApiKey } from "../../utils/omdb.js";
import type {
  CreateFilmInput,
  FilmQueryInput,
  ImportOmdbInput,
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
  deletedAt: Date | null;
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
    deletedAt: film.deletedAt ? film.deletedAt.toISOString() : null,
    createdAt: film.createdAt.toISOString(),
    updatedAt: film.updatedAt.toISOString(),
    links: filmLinks(film.id)
  };
}

function buildWhere(query: FilmQueryInput): Prisma.FilmWhereInput {
  const where: Prisma.FilmWhereInput = {
    deletedAt: null,
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
    where.rating = {
      gte: query.rating
    };
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

  if (!film || film.deletedAt) {
    throw new FilmError("Film not found", 404);
  }

  return formatFilm(film);
}

export async function createFilm(input: CreateFilmInput) {
  try {
    const film = await prisma.film.create({
      data: input
    });

    if (film.isLive) {
      await publishFilmMadeLive(film);
    }

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

type OmdbFilmResponse = {
  Response?: string;
  Error?: string;
  Title?: string;
  Year?: string;
  Genre?: string;
  Director?: string;
  Actors?: string;
  Plot?: string;
  Poster?: string;
  Runtime?: string;
  Language?: string;
  Country?: string;
  imdbID?: string;
  imdbRating?: string;
  [key: string]: unknown;
};

function parseYear(value: string | undefined) {
  const match = value?.match(/\d{4}/);

  return match ? Number(match[0]) : undefined;
}

function parseRuntime(value: string | undefined) {
  const match = value?.match(/\d+/);

  return match ? Number(match[0]) : undefined;
}

function parseRating(value: string | undefined) {
  const rating = Number(value);

  return Number.isFinite(rating) ? rating : undefined;
}

function normaliseOmdbText(value: string | undefined) {
  return value && value !== "N/A" ? value : undefined;
}

export async function importFilmFromOmdb(input: ImportOmdbInput) {
  const apiKey = normaliseOmdbApiKey(env.OMDB_API_KEY);

  if (!apiKey) {
    throw new FilmError("OMDB API key is not configured", 500);
  }

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);

  if (input.imdbId) {
    url.searchParams.set("i", input.imdbId);
  } else if (input.title) {
    url.searchParams.set("t", input.title);
  }

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new FilmError("OMDB API request failed", 502);
  }

  if (!response.ok) {
    throw new FilmError("OMDB API request failed", 502);
  }

  let omdbFilm: OmdbFilmResponse;

  try {
    omdbFilm = (await response.json()) as OmdbFilmResponse;
  } catch {
    throw new FilmError("OMDB API response was invalid", 502);
  }

  if (omdbFilm.Response === "False") {
    throw new FilmError("Film not found in OMDB", 404);
  }

  if (!omdbFilm.Title) {
    throw new FilmError("OMDB API response was invalid", 502);
  }

  const filmData = {
    title: omdbFilm.Title,
    genre: normaliseOmdbText(omdbFilm.Genre),
    year: parseYear(omdbFilm.Year),
    rating: parseRating(omdbFilm.imdbRating),
    director: normaliseOmdbText(omdbFilm.Director),
    cast: normaliseOmdbText(omdbFilm.Actors),
    plot: normaliseOmdbText(omdbFilm.Plot),
    posterUrl: normaliseOmdbText(omdbFilm.Poster),
    runtime: parseRuntime(omdbFilm.Runtime),
    language: normaliseOmdbText(omdbFilm.Language),
    country: normaliseOmdbText(omdbFilm.Country),
    imdbId: normaliseOmdbText(omdbFilm.imdbID),
    omdbMetadataJson: JSON.stringify(omdbFilm),
    isLive: true
  };

  try {
    const previousFilm = filmData.imdbId
      ? await prisma.film.findUnique({
          where: {
            imdbId: filmData.imdbId
          }
        })
      : null;

    if (previousFilm?.deletedAt) {
      throw new FilmError("Deleted film cannot be imported or republished", 409);
    }

    const film = filmData.imdbId
      ? await prisma.film.upsert({
          where: {
            imdbId: filmData.imdbId
          },
          create: filmData,
          update: filmData
        })
      : await prisma.film.create({
          data: filmData
        });

    if (!previousFilm?.isLive && film.isLive) {
      await publishFilmMadeLive(film);
    }

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
    const [previousFilm, film] = await prisma.$transaction(async (tx) => {
      const existingFilm = await tx.film.findFirst({
        where: { id }
      });

      if (!existingFilm || existingFilm.deletedAt) {
        throw new FilmError("Film not found", 404);
      }

      const updatedFilm = await tx.film.update({
        where: { id },
        data: input
      });

      return [existingFilm, updatedFilm];
    });

    if (!previousFilm.isLive && film.isLive) {
      await publishFilmMadeLive(film);
    }

    return formatFilm(film);
  } catch (error) {
    if (error instanceof FilmError) {
      throw error;
    }

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
        deletedAt: new Date(),
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
