import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

type JwtPayload = {
  sub?: string;
  role?: string;
};

export const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Bearer token is required"
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!payload.sub) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token"
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    if (!user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token"
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token"
    });
  }
};
