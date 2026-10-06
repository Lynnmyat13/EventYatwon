import { lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  ProtectedRoute,
  RoleProtectedRoute,
} from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthProvider";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { EventsPage } from "@/pages/EventsPage";
import { AboutPage } from "@/pages/AboutPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RegistrationConfirmationPage } from "@/pages/RegistrationConfirmationPage";

const CreateEventPage = lazy(() =>
  import("@/pages/CreateEventPage").then((module) => ({
    default: module.CreateEventPage,
  })),
);

const EventDetailsPage = lazy(() =>
  import("@/pages/EventDetailsPage").then((module) => ({
    default: module.EventDetailsPage,
  })),
);

const MyEventsPage = lazy(() =>
  import("@/pages/MyEventsPage").then((module) => ({
    default: module.MyEventsPage,
  })),
);

const OrganizerEventsPage = lazy(() =>
  import("@/pages/OrganizerEventsPage").then((module) => ({
    default: module.OrganizerEventsPage,
  })),
);

const MyTicketsPage = lazy(() =>
  import("@/pages/MyTicketsPage").then((module) => ({
    default: module.MyTicketsPage,
  })),
);

const TicketDetailsPage = lazy(() =>
  import("@/pages/TicketDetailsPage").then((module) => ({
    default: module.TicketDetailsPage,
  })),
);

const OrganizerCheckInPage = lazy(() =>
  import("@/pages/OrganizerCheckInPage").then((module) => ({
    default: module.OrganizerCheckInPage,
  })),
);

const EventManagementPage = lazy(() =>
  import("@/pages/EventManagementPage").then((module) => ({
    default: module.EventManagementPage,
  })),
);

const AttendeeDashboardPage = lazy(() =>
  import("@/pages/AttendeeDashboardPage").then((module) => ({
    default: module.AttendeeDashboardPage,
  })),
);

const SavedEventsPage = lazy(() =>
  import("@/pages/SavedEventsPage").then((module) => ({
    default: module.SavedEventsPage,
  })),
);

const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  })),
);

const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);

const AdminDashboardPage = lazy(() =>
  import("@/pages/AdminPages").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("@/pages/AdminPages").then((module) => ({
    default: module.AdminUsersPage,
  })),
);
const AdminEventsPage = lazy(() =>
  import("@/pages/AdminPages").then((module) => ({
    default: module.AdminEventsPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import("@/pages/AdminPages").then((module) => ({
    default: module.AdminCategoriesPage,
  })),
);
const OrganizerProfilePage = lazy(() =>
  import("@/pages/OrganizerProfilePage").then((module) => ({
    default: module.OrganizerProfilePage,
  })),
);
const EventCalendarPage = lazy(() =>
  import("@/pages/EventCalendarPage").then((module) => ({
    default: module.EventCalendarPage,
  })),
);
const RecommendedEventsPage = lazy(() =>
  import("@/pages/RecommendedEventsPage").then((module) => ({
    default: module.RecommendedEventsPage,
  })),
);
const HelpCenterPage = lazy(() =>
  import("@/pages/HelpCenterPage").then((module) => ({
    default: module.HelpCenterPage,
  })),
);
const ContactSupportPage = lazy(() =>
  import("@/pages/ContactSupportPage").then((module) => ({
    default: module.ContactSupportPage,
  })),
);

const router = createBrowserRouter([
  {
    element: (
      <ProtectedRoute>
        <AccountLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/profile",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "/notifications",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: "/saved-events",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <SavedEventsPage />
          </Suspense>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <Suspense fallback={<AdminLoader />}>
              <AttendeeDashboardPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "/my-events",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <Suspense fallback={<AdminLoader />}>
              <MyEventsPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "/my-tickets",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <Suspense fallback={<AdminLoader />}>
              <MyTicketsPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "/organizer/events",
        element: (
          <RoleProtectedRoute roles={["organizer"]}>
            <Suspense fallback={<AdminLoader />}>
              <OrganizerEventsPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "/admin",
        element: (
          <RoleProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </RoleProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<AdminLoader />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: "users",
            element: (
              <Suspense fallback={<AdminLoader />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: "events",
            element: (
              <Suspense fallback={<AdminLoader />}>
                <AdminEventsPage />
              </Suspense>
            ),
          },
          {
            path: "categories",
            element: (
              <Suspense fallback={<AdminLoader />}>
                <AdminCategoriesPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      {
        path: "calendar",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <EventCalendarPage />
          </Suspense>
        ),
      },
      {
        path: "recommended",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <Suspense fallback={<AdminLoader />}>
              <RecommendedEventsPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "organizers/:id",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <OrganizerProfilePage />
          </Suspense>
        ),
      },
      {
        path: "help",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <HelpCenterPage />
          </Suspense>
        ),
      },
      {
        path: "contact",
        element: (
          <Suspense fallback={<AdminLoader />}>
            <ContactSupportPage />
          </Suspense>
        ),
      },
      { path: "events", element: <EventsPage /> },
      {
        path: "events/create",
        element: (
          <RoleProtectedRoute roles={["organizer"]}>
            <Suspense
              fallback={
                <div
                  className="grid min-h-[55dvh] place-items-center"
                  role="status"
                  aria-label="Loading event form"
                >
                  <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
                </div>
              }
            >
              <CreateEventPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "events/:slug",
        element: (
          <Suspense
            fallback={
              <div
                className="grid min-h-[55dvh] place-items-center"
                role="status"
                aria-label="Loading event"
              >
                <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
              </div>
            }
          >
            <EventDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "registrations/:id",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <RegistrationConfirmationPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "tickets/:id",
        element: (
          <RoleProtectedRoute roles={["attendee"]}>
            <Suspense
              fallback={
                <div
                  className="grid min-h-[55dvh] place-items-center"
                  role="status"
                  aria-label="Loading ticket"
                >
                  <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
                </div>
              }
            >
              <TicketDetailsPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "organizer/events/:eventId/check-in",
        element: (
          <RoleProtectedRoute roles={["organizer", "admin"]}>
            <Suspense
              fallback={
                <div
                  className="grid min-h-[55dvh] place-items-center"
                  role="status"
                  aria-label="Loading ticket check-in"
                >
                  <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
                </div>
              }
            >
              <OrganizerCheckInPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      {
        path: "organizer/events/:eventId/manage",
        element: (
          <RoleProtectedRoute roles={["organizer", "admin"]}>
            <Suspense
              fallback={
                <div
                  className="grid min-h-[55dvh] place-items-center"
                  role="status"
                  aria-label="Loading event management"
                >
                  <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
                </div>
              }
            >
              <EventManagementPage />
            </Suspense>
          </RoleProtectedRoute>
        ),
      },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

function AdminLoader() {
  return (
    <div
      className="grid min-h-[55dvh] place-items-center"
      role="status"
      aria-label="Loading admin page"
    >
      <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
    </div>
  );
}

export default App;
