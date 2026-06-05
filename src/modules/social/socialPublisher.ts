import { env } from "../../config/env.js";

export type SocialFilmPayload = {
  id: string;
  title: string;
  genre: string | null;
  year: number | null;
  rating: number | null;
  imdbId: string | null;
};

export type SocialPostPayload = {
  event: "FILM_MADE_LIVE";
  message: string;
  film: SocialFilmPayload;
};

type SocialPublisher = (payload: SocialPostPayload) => Promise<void>;

function buildFilmLiveMessage(film: SocialFilmPayload) {
  const parts = [
    `New film is now live: ${film.title}`,
    film.year ? `(${film.year})` : undefined,
    film.genre ? `Genre: ${film.genre}` : undefined,
    film.rating !== null ? `IMDb ${film.rating}` : undefined
  ].filter(Boolean);

  return parts.join(" | ");
}

async function webhookSocialPublisher(payload: SocialPostPayload) {
  if (!env.SOCIAL_POST_ENABLED || !env.SOCIAL_WEBHOOK_URL) {
    return;
  }

  const discordPayload = {
    content: payload.message,
    embeds: [
      {
        title: payload.film.title,
        description: "A new film entry has been made live in CinemaVault.",
        fields: [
          payload.film.year
            ? { name: "Year", value: String(payload.film.year), inline: true }
            : undefined,
          payload.film.genre
            ? { name: "Genre", value: payload.film.genre, inline: true }
            : undefined,
          payload.film.rating !== null
            ? { name: "IMDb", value: String(payload.film.rating), inline: true }
            : undefined,
          payload.film.imdbId
            ? { name: "IMDb ID", value: payload.film.imdbId, inline: true }
            : undefined
        ].filter(Boolean)
      }
    ]
  };

  try {
    const response = await fetch(env.SOCIAL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      console.warn(`Social webhook failed with status ${response.status}`);
    }
  } catch (error) {
    console.warn("Social webhook request failed", error);
  }
}

let socialPublisher: SocialPublisher = webhookSocialPublisher;

export async function publishFilmMadeLive(film: SocialFilmPayload) {
  await socialPublisher({
    event: "FILM_MADE_LIVE",
    message: buildFilmLiveMessage(film),
    film
  });
}

export function setSocialPublisherForTest(publisher: SocialPublisher) {
  if (env.NODE_ENV !== "test") {
    throw new Error("Social publisher can only be replaced in tests");
  }

  socialPublisher = publisher;
}

export function resetSocialPublisherForTest() {
  socialPublisher = webhookSocialPublisher;
}
