import type { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin is not allowed"));
  },
  credentials: true
};
