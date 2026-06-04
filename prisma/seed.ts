import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { normaliseOmdbApiKey } from "../src/utils/omdb.js";

const prisma = new PrismaClient();

const adminPassword = "AdminPassword123!";
const userPassword = "UserPassword123!";

const seedFilmImdbIds = [
  "tt1375666",
  "tt0133093",
  "tt6751668",
  "tt0245429",
  "tt0816692",
  "tt0468569",
  "tt6710474",
  "tt15239678",
  "tt0111161",
  "tt0110912",
  "tt0109830",
  "tt0137523",
  "tt0099685",
  "tt0114369",
  "tt0102926",
  "tt0172495",
  "tt0120737",
  "tt0167261",
  "tt0167260",
  "tt0076759",
  "tt1856101",
  "tt1392190",
  "tt3783958",
  "tt5052448"
];

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

function mapOmdbFilm(omdbFilm: OmdbFilmResponse, imdbId: string) {
  if (!omdbFilm.Title) {
    throw new Error(`OMDB response for ${imdbId} did not include a title`);
  }

  return {
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
    imdbId: normaliseOmdbText(omdbFilm.imdbID) ?? imdbId,
    omdbMetadataJson: JSON.stringify(omdbFilm),
    isLive: true
  };
}

async function fetchOmdbFilm(imdbId: string) {
  const apiKey = normaliseOmdbApiKey(process.env.OMDB_API_KEY);

  if (!apiKey) {
    throw new Error("OMDB_API_KEY is required to seed films from OMDB");
  }

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("i", imdbId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OMDB request failed for ${imdbId} with HTTP ${response.status}`);
  }

  const omdbFilm = (await response.json()) as OmdbFilmResponse;

  if (omdbFilm.Response === "False") {
    throw new Error(`OMDB did not return ${imdbId}: ${omdbFilm.Error ?? "unknown error"}`);
  }

  return mapOmdbFilm(omdbFilm, imdbId);
}

async function seedFilmFromOmdb(imdbId: string) {
  const film = await fetchOmdbFilm(imdbId);

  return prisma.film.upsert({
    where: { imdbId },
    update: film,
    create: film
  });
}

async function main() {
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(userPassword, 12)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cinemavault.local" },
    update: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      displayName: "CinemaVault Admin"
    },
    create: {
      email: "admin@cinemavault.local",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      displayName: "CinemaVault Admin"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "member@cinemavault.local" },
    update: {
      username: "member",
      passwordHash: userPasswordHash,
      role: "USER",
      displayName: "CinemaVault Member"
    },
    create: {
      email: "member@cinemavault.local",
      username: "member",
      passwordHash: userPasswordHash,
      role: "USER",
      displayName: "CinemaVault Member"
    }
  });

  const seededFilms = [];

  for (const imdbId of seedFilmImdbIds) {
    seededFilms.push(await seedFilmFromOmdb(imdbId));
  }

  await prisma.favourite.upsert({
    where: {
      userId_filmId: {
        userId: user.id,
        filmId: seededFilms[0].id
      }
    },
    update: {},
    create: {
      userId: user.id,
      filmId: seededFilms[0].id
    }
  });

  await prisma.watchlistItem.upsert({
    where: {
      userId_filmId: {
        userId: user.id,
        filmId: seededFilms[1].id
      }
    },
    update: {
      status: "PLANNED",
      notes: "Demo watchlist record"
    },
    create: {
      userId: user.id,
      filmId: seededFilms[1].id,
      status: "PLANNED",
      notes: "Demo watchlist record"
    }
  });

  await prisma.watchedRecord.upsert({
    where: {
      userId_filmId: {
        userId: user.id,
        filmId: seededFilms[2].id
      }
    },
    update: {
      rating: 9,
      reviewNote: "Excellent demo watched record."
    },
    create: {
      userId: user.id,
      filmId: seededFilms[2].id,
      rating: 9,
      reviewNote: "Excellent demo watched record."
    }
  });

  const existingMessage = await prisma.message.findFirst({
    where: {
      userId: user.id,
      filmId: seededFilms[3].id,
      subject: "Demo message"
    }
  });

  if (!existingMessage) {
    await prisma.message.create({
      data: {
        userId: user.id,
        filmId: seededFilms[3].id,
        adminId: admin.id,
        subject: "Demo message",
        body: "Could you confirm whether this film will remain available this week?",
        replyBody: "Yes, this film is currently available.",
        status: "REPLIED",
        repliedAt: new Date()
      }
    });
  }

  console.log("Seed complete");
  console.log("Admin: admin@cinemavault.local / AdminPassword123!");
  console.log("User: member@cinemavault.local / UserPassword123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
