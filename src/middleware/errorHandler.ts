import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "ValidationError",
      message: "Request validation failed",
      details: error.flatten()
    });
    return;
  }

  const statusCode =
    typeof error.statusCode === "number" && error.statusCode >= 400
      ? error.statusCode
      : 500;

  res.status(statusCode).json({
    error: statusCode === 500 ? "InternalServerError" : "RequestError",
    message:
      statusCode === 500 && env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message ?? "An unexpected error occurred"
  });
};
