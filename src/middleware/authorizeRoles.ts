import type { RequestHandler } from "express";

export function authorizeRoles(...allowedRoles: string[]): RequestHandler {
  const normalizedRoles = allowedRoles.map((role) => role.toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication is required"
      });
      return;
    }

    if (!normalizedRoles.includes(req.user.role.toUpperCase())) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource"
      });
      return;
    }

    next();
  };
}
