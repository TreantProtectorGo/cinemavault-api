import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import {
  createFilm,
  deleteFilm,
  getFilmById,
  listFilms,
  updateFilm
} from "./films.service.js";
import {
  createFilmSchema,
  filmIdParamSchema,
  filmQuerySchema,
  updateFilmSchema
} from "./films.schemas.js";

export const filmsRouter = Router();

filmsRouter.get("/", async (req, res, next) => {
  try {
    const query = filmQuerySchema.parse(req.query);
    const result = await listFilms(query);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

filmsRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = filmIdParamSchema.parse(req.params);
    const film = await getFilmById(id);

    res.json(film);
  } catch (error) {
    next(error);
  }
});

filmsRouter.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const input = createFilmSchema.parse(req.body);
      const film = await createFilm(input);

      res.status(201).json(film);
    } catch (error) {
      next(error);
    }
  }
);

filmsRouter.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = filmIdParamSchema.parse(req.params);
      const input = updateFilmSchema.parse(req.body);
      const film = await updateFilm(id, input);

      res.json(film);
    } catch (error) {
      next(error);
    }
  }
);

filmsRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = filmIdParamSchema.parse(req.params);
      const film = await deleteFilm(id);

      res.json(film);
    } catch (error) {
      next(error);
    }
  }
);
