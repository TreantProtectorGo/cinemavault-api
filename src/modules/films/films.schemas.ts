import { z } from "zod";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean());

export const filmIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^c[a-z0-9]{10,}$/i, "Film id must be a valid cuid-style identifier")
});

export const filmQuerySchema = z.object({
  title: z.string().trim().min(1).optional(),
  genre: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().min(1888).max(2100).optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  isLive: booleanQuerySchema.optional(),
  sortBy: z
    .enum(["title", "genre", "year", "rating", "createdAt", "updatedAt"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export const createFilmSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    genre: z.string().trim().min(1).max(100).optional(),
    year: z.number().int().min(1888).max(2100).optional(),
    rating: z.number().min(0).max(10).optional(),
    director: z.string().trim().min(1).max(160).optional(),
    cast: z.string().trim().min(1).max(1000).optional(),
    plot: z.string().trim().min(1).max(5000).optional(),
    posterUrl: z.string().url().max(2048).optional(),
    runtime: z.number().int().positive().max(1000).optional(),
    language: z.string().trim().min(1).max(120).optional(),
    country: z.string().trim().min(1).max(120).optional(),
    imdbId: z.string().trim().min(1).max(32).optional(),
    omdbMetadataJson: z.string().trim().min(1).optional(),
    isLive: z.boolean().default(false)
  })
  .strict();

export const updateFilmSchema = createFilmSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one film field must be provided"
  });

export const importOmdbSchema = z
  .object({
    imdbId: z.string().trim().min(1).max(32).optional(),
    title: z.string().trim().min(1).max(200).optional()
  })
  .strict()
  .refine((value) => value.imdbId || value.title, {
    message: "Either imdbId or title must be provided"
  });

export type CreateFilmInput = z.infer<typeof createFilmSchema>;
export type UpdateFilmInput = z.infer<typeof updateFilmSchema>;
export type FilmQueryInput = z.infer<typeof filmQuerySchema>;
export type ImportOmdbInput = z.infer<typeof importOmdbSchema>;
