import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminPassword = "AdminPassword123!";
const userPassword = "UserPassword123!";

const films = [
  {
    title: "Inception",
    genre: "Sci-Fi",
    year: 2010,
    rating: 8.8,
    director: "Christopher Nolan",
    cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
    plot: "A thief enters dreams to steal corporate secrets.",
    runtime: 148,
    language: "English",
    country: "USA",
    imdbId: "tt1375666",
    isLive: true
  },
  {
    title: "The Matrix",
    genre: "Action, Sci-Fi",
    year: 1999,
    rating: 8.7,
    director: "Lana Wachowski, Lilly Wachowski",
    cast: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss",
    plot: "A hacker discovers the hidden truth about his reality.",
    runtime: 136,
    language: "English",
    country: "USA",
    imdbId: "tt0133093",
    isLive: true
  },
  {
    title: "Parasite",
    genre: "Drama, Thriller",
    year: 2019,
    rating: 8.5,
    director: "Bong Joon Ho",
    cast: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong",
    plot: "Class tension escalates when two families become entangled.",
    runtime: 132,
    language: "Korean",
    country: "South Korea",
    imdbId: "tt6751668",
    isLive: true
  },
  {
    title: "Spirited Away",
    genre: "Animation, Adventure",
    year: 2001,
    rating: 8.6,
    director: "Hayao Miyazaki",
    cast: "Rumi Hiiragi, Miyu Irino, Mari Natsuki",
    plot: "A young girl enters a mysterious spirit world.",
    runtime: 125,
    language: "Japanese",
    country: "Japan",
    imdbId: "tt0245429",
    isLive: true
  }
];

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

  for (const film of films) {
    seededFilms.push(
      await prisma.film.upsert({
        where: { imdbId: film.imdbId },
        update: film,
        create: film
      })
    );
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
