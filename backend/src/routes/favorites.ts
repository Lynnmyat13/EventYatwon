import { Router } from "express";
import {
  addFavorite,
  getFavoriteStatus,
  getMyFavorites,
  removeFavorite,
} from "../controllers/favorites";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/", getMyFavorites);
router.get("/me", getMyFavorites);
router.get("/:eventId/status", getFavoriteStatus);
router.post("/:eventId", addFavorite);
router.delete("/:eventId", removeFavorite);

export default router;
