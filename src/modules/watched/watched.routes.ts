import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  watchedBodySchema,
  watchedFilmIdParamSchema
} from "./watched.schemas.js";
import {
  addWatchedRecord,
  listWatched,
  removeWatchedRecord
} from "./watched.service.js";

export const watchedRouter = Router();

watchedRouter.use(authenticate);

watchedRouter.get("/", async (req, res, next) => {
  try {
    const result = await listWatched(req.user!.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

watchedRouter.post("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = watchedFilmIdParamSchema.parse(req.params);
    const input = watchedBodySchema.parse(req.body);
    const result = await addWatchedRecord(req.user!.id, filmId, input);

    res.status(result.created ? 201 : 200).json(result.record);
  } catch (error) {
    next(error);
  }
});

watchedRouter.delete("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = watchedFilmIdParamSchema.parse(req.params);
    const result = await removeWatchedRecord(req.user!.id, filmId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
