import { Router } from "express";
import { submitSupportRequest } from "../controllers/support";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.post("/", optionalAuth, submitSupportRequest);

export default router;
