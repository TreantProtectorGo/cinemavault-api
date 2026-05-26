import { z } from "zod";

export const watchedFilmIdParamSchema = z.object({
  filmId: z
    .string()
    .trim()
    .regex(/^c[a-z0-9]{10,}$/i, "Film id must be a valid cuid-style identifier")
});

export const watchedBodySchema = z
  .object({
    rating: z.number().int().min(1).max(10).optional(),
    notes: z.string().trim().min(1).max(1000).optional()
  })
  .strict()
  .default({});

export type WatchedBodyInput = z.infer<typeof watchedBodySchema>;
export type WatchedFilmIdParams = z.infer<typeof watchedFilmIdParamSchema>;
