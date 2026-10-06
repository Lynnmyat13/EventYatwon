import { Router } from "express";
import { organizer } from "../controllers/organizers";

const router = Router();

router.get("/:id", organizer);

export default router;
