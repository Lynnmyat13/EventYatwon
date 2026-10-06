# EventYatwon
<<<<<<< HEAD

EventYatwon is a full-stack event discovery, registration, digital ticketing, and event-management platform. It supports public event browsing, attendee registration and QR tickets, organizer operations and analytics, and role-protected administration.

For step-by-step instructions for visitors, attendees, organizers, and administrators, see the [User Guide](./USER_GUIDE.md).

## Features

### Public experience

- Searchable and filterable published-event directory
- Monthly event calendar
- Event details, ticket availability, venue maps, and public reviews
- Public organizer profiles and published-event history
- About page, searchable Help Center, and support requests

### Attendees

- Personalized dashboard and recommended events
- Event registration with ticket-type and quantity selection
- Capacity and ticket-availability enforcement
- Digital tickets with secure QR tokens and unique ticket codes
- PDF ticket downloads
- Registration cancellation and personal history management
- Saved events, notifications, and post-event reviews

### Organizers

- Multi-step event creation with draft and published states
- Ticket types, pricing, capacity, venue, schedule, and banner management
- Safe deletion of organizer-owned draft events
- Attendee, ticket, and check-in management
- Camera-based QR scanning and manual ticket-code check-in
- Event analytics for registrations, revenue, ticket types, and attendance
- Public organizer profiles

### Administrators

- Platform statistics and recent activity
- User search, role/status filtering, and activation controls
- Event search, filtering, management access, and cancellation
- Category statistics derived from event data
- Backend-enforced admin authorization

## Technology

### Frontend

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4 and shadcn/ui components
- React Router
- TanStack Query
- Axios
- React Hook Form and Zod
- Recharts
- ZXing QR scanner and `qrcode.react`
- jsPDF

### Backend

- Node.js and TypeScript
- Express 5
- MongoDB and Mongoose
- JWT authentication
- bcrypt password hashing
- Multer image validation
- Cloudinary image storage

## Project structure

```text
EventYatwon/
├── backend/
│   └── src/
│       ├── config/       # Database, authentication, and Cloudinary configuration
│       ├── controllers/  # HTTP request validation and responses
│       ├── middleware/   # Authentication, authorization, and uploads
│       ├── models/       # Mongoose models
│       ├── routes/       # Express API routes
│       ├── services/     # Business logic
│       └── utils/        # Shared backend utilities
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Shared application and UI components
│       ├── context/      # Authentication context
│       ├── hooks/        # Shared React hooks
│       ├── layouts/      # Public, account, and admin layouts
│       ├── lib/          # Query keys, validation, and utilities
│       ├── pages/        # Route-level pages
│       ├── services/     # API clients
│       └── types/        # Frontend TypeScript types
├── README.md
└── USER_GUIDE.md
```

## Requirements

- Node.js 22.12 or newer
- npm
- MongoDB Atlas or a local MongoDB replica set
- A Cloudinary account if profile-image and event-banner uploads are required

## Local setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then configure:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/eventyatwon_db
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`MONGODB_URI` and `JWT_SECRET` are required. Registration and cancellation use MongoDB transactions, so a local MongoDB server must run as a replica set. Cloudinary variables are required for uploaded profile images and event banners. Events can still use a public banner URL when image upload storage is not configured.

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default. A health check is available at `GET /api/health`.

### 2. Install frontend dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, normally `http://localhost:5173`.

## Available commands

### Backend

Run from `backend/`:

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start the API with file watching       |
| `npm run typecheck` | Run TypeScript checking without output |
| `npm run build`     | Compile TypeScript into `backend/dist` |
| `npm start`         | Run the compiled API                   |

### Frontend

Run from `frontend/`:

| Command           | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite development server         |
| `npm run lint`    | Run Oxlint                                |
| `npm run build`   | Typecheck and create the production build |
| `npm run preview` | Preview the production build locally      |

## Account roles

| Role      | Access                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------ |
| Attendee  | Registrations, tickets, saved events, recommendations, notifications, and reviews                |
| Organizer | Event creation, owned-event management, analytics, and check-in                                  |
| Admin     | Platform overview, user administration, event moderation, categories, and event-operation access |

Public registration is limited to attendee and organizer accounts. Administrator accounts must be provisioned through a private administrative process and must not be added to public registration.

## API overview

The backend is mounted under `/api`.

| Route group          | Purpose                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `/api/auth`          | Registration, login, profile, and avatar management                                               |
| `/api/events`        | Public events, recommendations, registration, reviews, organizer events, management, and check-in |
| `/api/organizers`    | Public organizer profiles                                                                         |
| `/api/registrations` | Attendee registration history and cancellation                                                    |
| `/api/tickets`       | Attendee ticket access and cancelled-ticket history                                               |
| `/api/favorites`     | Saved events                                                                                      |
| `/api/notifications` | Notification listing, read state, and deletion                                                    |
| `/api/reviews`       | Review updates and deletion                                                                       |
| `/api/support`       | Public and authenticated support requests                                                         |
| `/api/admin`         | Role-protected administration                                                                     |

## Application behavior

- The frontend uses TanStack Query for server state, loading/error states, and scoped cache invalidation.
- Personalized and role-specific query data is removed on logout.
- Passwords are hashed with bcrypt before storage.
- JWT access tokens expire after seven days.
- Public registration cannot create an administrator.
- Event registration enforces event capacity, ticket availability, valid status, and one registration per user/event.
- Registration and ticket creation use the existing backend business logic and transaction safeguards.
- Organizers can delete only their own draft events; the backend enforces this restriction.
- Check-in validates ticket ownership, event association, ticket status, and previous check-in state.

## Production checklist

- Use a long, randomly generated `JWT_SECRET`.
- Use a production MongoDB connection with appropriate access controls and backups.
- Configure Cloudinary if uploads are enabled.
- Set `VITE_API_URL` to the deployed API URL before building the frontend.
- Restrict API CORS settings to the deployed frontend origin.
- Serve both applications over HTTPS.
- Provision administrator accounts privately and never commit credentials.
- Run frontend lint/build and backend typecheck/build before deployment.

## Verification

```bash
cd backend
npm run typecheck
npm run build

cd ../frontend
npm run lint
npm run build
```

These commands do not seed or modify MongoDB data.
=======
EventYatwon is a full-stack event management platform featuring event discovery, registration, QR code ticketing, attendee check-in, personalized recommendations, event reviews, organizer analytics, and admin dashboards. Built with React, TypeScript, Node.js, Express, and MongoDB.
>>>>>>> eb44688ac87d91a4387cb7257b5428541b715b4a
