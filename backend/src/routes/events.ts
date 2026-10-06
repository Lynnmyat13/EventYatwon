import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventBySlug,
  getEventStats,
  getEvents,
  getRecommendedEvents,
  getMyEvents,
  removeEventBanner,
  replaceEventBanner,
  updateEvent,
} from "../controllers/events";
import { registerForEvent } from "../controllers/registrations";
import { checkInTicket } from "../controllers/tickets";
import { createReview, getEventReviews } from "../controllers/reviews";
import {
  getManagementAttendees,
  getManagementAnalytics,
  getManagementCheckIns,
  getManagementOverview,
  getManagementTickets,
} from "../controllers/eventManagement";
import { authorizeRoles, optionalAuth, requireAuth } from "../middleware/auth";
import { eventBannerUpload } from "../middleware/upload";

const router = Router();

router.get("/", getEvents);
router.get("/stats", getEventStats);
router.get(
  "/recommended",
  requireAuth,
  authorizeRoles("attendee"),
  getRecommendedEvents,
);
router.get("/my-events", requireAuth, authorizeRoles("organizer"), getMyEvents);
router.post(
  "/",
  requireAuth,
  authorizeRoles("organizer"),
  eventBannerUpload.single("bannerImage"),
  createEvent,
);
router.get(
  "/:eventId/manage/overview",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  getManagementOverview,
);
router.get(
  "/:eventId/manage/analytics",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  getManagementAnalytics,
);
router.get(
  "/:eventId/manage/attendees",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  getManagementAttendees,
);
router.get(
  "/:eventId/manage/tickets",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  getManagementTickets,
);
router.get(
  "/:eventId/manage/check-ins",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  getManagementCheckIns,
);
router.post(
  "/:eventId/register",
  requireAuth,
  authorizeRoles("attendee"),
  registerForEvent,
);
router.get("/:eventId/reviews", optionalAuth, getEventReviews);
router.post(
  "/:eventId/reviews",
  requireAuth,
  authorizeRoles("attendee"),
  createReview,
);
router.post(
  "/:eventId/check-in",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  checkInTicket,
);
router.post(
  "/:id/banner",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  eventBannerUpload.single("bannerImage"),
  replaceEventBanner,
);
router.delete(
  "/:id/banner",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  removeEventBanner,
);
router.put(
  "/:id",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  updateEvent,
);
router.delete(
  "/:id",
  requireAuth,
  authorizeRoles("organizer", "admin"),
  deleteEvent,
);
router.get("/:slug", getEventBySlug);

export default router;
