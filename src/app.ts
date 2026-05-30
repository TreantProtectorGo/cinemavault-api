import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { favouritesRouter } from "./modules/favourites/favourites.routes.js";
import { filmsRouter } from "./modules/films/films.routes.js";
import {
  adminMessagesRouter,
  messagesRouter
} from "./modules/messages/messages.routes.js";
import { watchedRouter } from "./modules/watched/watched.routes.js";
import { watchlistRouter } from "./modules/watchlist/watchlist.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { docsRouter } from "./routes/docs.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/v1/health", healthRouter);
app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/films", filmsRouter);
app.use("/api/v1/favourites", favouritesRouter);
app.use("/api/v1/watchlist", watchlistRouter);
app.use("/api/v1/watched", watchedRouter);
app.use("/api/v1/messages", messagesRouter);
app.use("/api/v1/admin/messages", adminMessagesRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api-docs", docsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
