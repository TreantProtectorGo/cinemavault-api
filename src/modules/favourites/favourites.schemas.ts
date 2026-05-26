import { z } from "zod";

export const favouriteFilmIdParamSchema = z.object({
  filmId: z
    .string()
    .trim()
    .regex(/^c[a-z0-9]{10,}$/i, "Film id must be a valid cuid-style identifier")
});

export type FavouriteFilmIdParams = z.infer<typeof favouriteFilmIdParamSchema>;
