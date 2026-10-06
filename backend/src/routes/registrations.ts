import { Router } from "express";
import {
  archiveCancelledRegistration,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationById,
} from "../controllers/registrations";
import { authorizeRoles, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth, authorizeRoles("attendee"));
router.get("/me", getMyRegistrations);
router.delete("/:id/history", archiveCancelledRegistration);
router.get("/:id", getRegistrationById);
router.delete("/:id", cancelRegistration);

export default router;
