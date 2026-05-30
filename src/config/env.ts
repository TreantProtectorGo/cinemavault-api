import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";
import { z } from "zod";

dotenv.config();

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z
    .union([z.string().min(1), z.number().positive()])
    .default("1h")
    .transform((value) => value as JwtExpiresIn),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  OMDB_API_KEY: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional()
  )
});

export const env = envSchema.parse(process.env);
