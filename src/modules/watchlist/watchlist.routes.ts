import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { watchlistFilmIdParamSchema } from "./watchlist.schemas.js";
import {
  addWatchlistItem,
  listWatchlist,
  removeWatchlistItem
} from "./watchlist.service.js";

export const watchlistRouter = Router();

watchlistRouter.use(authenticate);

watchlistRouter.get("/", async (req, res, next) => {
  try {
    const result = await listWatchlist(req.user!.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

watchlistRouter.post("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = watchlistFilmIdParamSchema.parse(req.params);
    const result = await addWatchlistItem(req.user!.id, filmId);

    res.status(result.created ? 201 : 200).json(result.record);
  } catch (error) {
    next(error);
  }
});

watchlistRouter.delete("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = watchlistFilmIdParamSchema.parse(req.params);
    const result = await removeWatchlistItem(req.user!.id, filmId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
