import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

export const adminRouter = Router();

adminRouter.get("/ping", authenticate, authorizeRoles("ADMIN"), (req, res) => {
  res.json({
    status: "ok",
    role: req.user?.role
  });
});
