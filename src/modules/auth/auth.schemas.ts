import { z } from "zod";

const roleSchema = z
  .enum(["admin", "user", "ADMIN", "USER"])
  .transform((role) => role.toUpperCase());

export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  role: roleSchema.default("USER")
});

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(1),
  password: z.string().min(1)
});

export const googleAuthSchema = z.object({
  credential: z.string().trim().min(1, "Google credential is required")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
