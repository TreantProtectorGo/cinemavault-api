import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/v1/health", healthRouter);
app.use("/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
