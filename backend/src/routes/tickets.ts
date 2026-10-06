import { Router } from "express";
import {
  archiveCancelledTicket,
  getMyTickets,
  getTicketById,
} from "../controllers/tickets";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/me", getMyTickets);
router.delete("/:id/history", archiveCancelledTicket);
router.get("/:id", getTicketById);

export default router;
