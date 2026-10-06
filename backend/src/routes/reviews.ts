import { Router } from "express";
import { deleteReview, updateReview } from "../controllers/reviews";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
