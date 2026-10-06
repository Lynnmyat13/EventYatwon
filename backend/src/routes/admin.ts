import { Router } from "express";
import {
  cancelEvent,
  categories,
  dashboard,
  events,
  updateUserStatus,
  user,
  users,
} from "../controllers/admin";
import { authorizeRoles, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth, authorizeRoles("admin"));
router.get("/dashboard", dashboard);
router.get("/users", users);
router.get("/users/:id", user);
router.patch("/users/:id/status", updateUserStatus);
router.get("/events", events);
router.patch("/events/:id/cancel", cancelEvent);
router.get("/categories", categories);

export default router;
