import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { favouriteFilmIdParamSchema } from "./favourites.schemas.js";
import {
  addFavourite,
  listFavourites,
  removeFavourite
} from "./favourites.service.js";

export const favouritesRouter = Router();

favouritesRouter.use(authenticate);

favouritesRouter.get("/", async (req, res, next) => {
  try {
    const result = await listFavourites(req.user!.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

favouritesRouter.post("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = favouriteFilmIdParamSchema.parse(req.params);
    const result = await addFavourite(req.user!.id, filmId);

    res.status(result.created ? 201 : 200).json(result.record);
  } catch (error) {
    next(error);
  }
});

favouritesRouter.delete("/:filmId", async (req, res, next) => {
  try {
    const { filmId } = favouriteFilmIdParamSchema.parse(req.params);
    const result = await removeFavourite(req.user!.id, filmId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
