import multer from "multer";
import { HttpError } from "../utils/http";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const imageUpload = (fileSize: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!IMAGE_TYPES.has(file.mimetype)) {
        callback(new HttpError(400, "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed"));
        return;
      }
      callback(null, true);
    },
  });

export const eventBannerUpload = imageUpload(8 * 1024 * 1024);
export const avatarUpload = imageUpload(5 * 1024 * 1024);
