import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import {
  createFilm,
  deleteFilm,
  getFilmById,
  importFilmFromOmdb,
  listFilms,
  updateFilm
} from "./films.service.js";
import {
  createFilmSchema,
  filmIdParamSchema,
  filmQuerySchema,
  importOmdbSchema,
  updateFilmSchema
} from "./films.schemas.js";

export const filmsRouter = Router();

function filmEtag(film: { id: string; updatedAt: string }) {
  return `W/"film-${film.id}-${new Date(film.updatedAt).getTime()}"`;
}

function hasMatchingEtag(ifNoneMatch: string | undefined, etag: string) {
  return (
    ifNoneMatch
      ?.split(",")
      .map((value) => value.trim())
      .includes(etag) ?? false
  );
}

function isNotModifiedSince(ifModifiedSince: string | undefined, updatedAt: string) {
  if (!ifModifiedSince) {
    return false;
  }

  const requestTime = new Date(ifModifiedSince).getTime();

  if (Number.isNaN(requestTime)) {
    return false;
  }

  const filmUpdatedAtSeconds = Math.floor(new Date(updatedAt).getTime() / 1000) * 1000;

  return requestTime >= filmUpdatedAtSeconds;
}

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
    const etag = filmEtag(film);
    const lastModified = new Date(film.updatedAt).toUTCString();

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", lastModified);

    if (
      hasMatchingEtag(req.header("If-None-Match"), etag) ||
      isNotModifiedSince(req.header("If-Modified-Since"), film.updatedAt)
    ) {
      res.status(304).end();
      return;
    }

    res.json(film);
  } catch (error) {
    next(error);
  }
});

filmsRouter.post(
  "/import-omdb",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const input = importOmdbSchema.parse(req.body);
      const film = await importFilmFromOmdb(input);

      res.status(201).json(film);
    } catch (error) {
      next(error);
    }
  }
);

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
