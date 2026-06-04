import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { updateProfileSchema } from "./profile.schemas.js";
import {
  getCurrentUserProfile,
  ProfileError,
  updateCurrentUserProfile,
  updateCurrentUserProfilePhoto
} from "./profile.service.js";

const avatarDirectory = path.resolve(process.cwd(), "uploads", "avatars");
const maxAvatarSizeBytes = 2 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByMimeType = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

fs.mkdirSync(avatarDirectory, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarDirectory);
  },
  filename: (req, file, callback) => {
    const extension =
      extensionByMimeType.get(file.mimetype) ||
      path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id ?? "user";

    callback(null, `${userId}-${Date.now()}-${randomUUID()}${extension}`);
  }
});

const uploadProfilePhoto = multer({
  storage: avatarStorage,
  limits: {
    fileSize: maxAvatarSizeBytes
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ProfileError("Only JPEG, PNG, and WEBP images are allowed", 400));
      return;
    }

    callback(null, true);
  }
}).single("profilePhoto");

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get("/", async (req, res, next) => {
  try {
    const profile = await getCurrentUserProfile(req.user!.id);

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

profileRouter.put("/", async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const profile = await updateCurrentUserProfile(req.user!.id, input);

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

profileRouter.post("/profile-photo", (req, res, next) => {
  uploadProfilePhoto(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        next(
          new ProfileError(
            error.code === "LIMIT_FILE_SIZE"
              ? "Profile photo must be 2MB or smaller"
              : "Invalid profile photo upload",
            400
          )
        );
        return;
      }

      next(error);
      return;
    }

    try {
      if (!req.file) {
        throw new ProfileError("Profile photo file is required", 400);
      }

      const profilePhotoUrl = `/uploads/avatars/${req.file.filename}`;
      const profile = await updateCurrentUserProfilePhoto(
        req.user!.id,
        profilePhotoUrl
      );

      res.json(profile);
    } catch (uploadError) {
      next(uploadError);
    }
  });
});
