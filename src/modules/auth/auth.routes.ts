import { Router } from "express";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { AuthError, loginUser, registerUser } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError || error instanceof AuthError) {
      next(error);
      return;
    }

    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    res.json(result);
  } catch (error) {
    if (error instanceof ZodError || error instanceof AuthError) {
      next(error);
      return;
    }

    next(error);
  }
});
