import { z } from "zod";

export const watchlistFilmIdParamSchema = z.object({
  filmId: z
    .string()
    .trim()
    .regex(/^c[a-z0-9]{10,}$/i, "Film id must be a valid cuid-style identifier")
});

export type WatchlistFilmIdParams = z.infer<typeof watchlistFilmIdParamSchema>;
