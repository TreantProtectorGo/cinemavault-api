import { z } from "zod";

const profilePhotoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value.startsWith("/uploads/avatars/") || z.string().url().safeParse(value).success,
    "profilePhotoUrl must be an absolute URL or an uploaded avatar path"
  );

export const updateProfileSchema = z
  .object({
    email: z.string().trim().email().toLowerCase().optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens")
      .optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
    profilePhotoUrl: profilePhotoUrlSchema.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field must be provided"
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
