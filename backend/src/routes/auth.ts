import { Router } from "express";
import {
  deleteAvatar,
  getCurrentUser,
  googleLogin,
  linkGoogle,
  login,
  logout,
  register,
  updateAvatar,
  updateCurrentUser,
} from "../controllers/auth";
import { requireAuth } from "../middleware/auth";
import { avatarUpload } from "../middleware/upload";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google/link", requireAuth, linkGoogle);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post("/logout", requireAuth, logout);
router.post(
  "/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  updateAvatar,
);
router.delete("/avatar", requireAuth, deleteAvatar);

export default router;
