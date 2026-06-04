import { Router, type Response } from "express";
import { ZodError } from "zod";
import { googleAuthSchema, loginSchema, registerSchema } from "./auth.schemas.js";
import {
  AuthError,
  loginWithGoogle,
  loginUser,
  registerUser,
  verifyBasicCredentials
} from "./auth.service.js";

export const authRouter = Router();

function sendBasicUnauthorized(res: Response) {
  res.setHeader("WWW-Authenticate", 'Basic realm="CinemaVault"');
  res.status(401).json({
    error: "Unauthorized",
    message: "Valid Basic Auth credentials are required"
  });
}

function parseBasicAuthHeader(header: string | undefined) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  const encodedCredentials = header.slice("Basic ".length).trim();

  if (!encodedCredentials) {
    return null;
  }

  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex <= 0) {
    return null;
  }

  const identifier = decodedCredentials.slice(0, separatorIndex);
  const password = decodedCredentials.slice(separatorIndex + 1);

  if (!identifier || !password) {
    return null;
  }

  return { identifier, password };
}

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

authRouter.post("/google", async (req, res, next) => {
  try {
    const input = googleAuthSchema.parse(req.body);
    const result = await loginWithGoogle(input);

    res.json(result);
  } catch (error) {
    if (error instanceof ZodError || error instanceof AuthError) {
      next(error);
      return;
    }

    next(error);
  }
});

authRouter.get("/basic-check", async (req, res, next) => {
  const credentials = parseBasicAuthHeader(req.header("Authorization"));

  if (!credentials) {
    sendBasicUnauthorized(res);
    return;
  }

  try {
    const user = await verifyBasicCredentials(
      credentials.identifier,
      credentials.password
    );

    res.json({
      status: "ok",
      auth: "basic",
      user
    });
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      sendBasicUnauthorized(res);
      return;
    }

    next(error);
  }
});
