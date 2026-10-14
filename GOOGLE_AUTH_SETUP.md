# Google authentication setup

EventYatwon uses Google Identity Services in the browser and verifies the
returned ID token on the backend with `google-auth-library`. The Google ID
token is never used as an EventYatwon access token and is not stored.

## Google Cloud

1. Open Google Cloud Console and configure the OAuth consent screen.
2. Create an **OAuth client ID** with application type **Web application**.
3. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - The deployed Vercel frontend origin, such as
     `https://eventyatwon.vercel.app`
4. Copy the generated client ID into both frontend and backend environment
   variables below. This credential flow does not require a Google client
   secret or a redirect URI.

Add every preview/custom frontend origin that should be allowed to display
the Google button. Keep the production list limited to origins you control.

## Environment variables

### Local frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Local backend (`backend/.env`)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Keep the existing `MONGODB_URI`, `JWT_SECRET`, Cloudinary variables, and
other backend settings unchanged.

### Vercel frontend

Set these in Project Settings -> Environment Variables, then redeploy:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Render backend

Set this in the service environment alongside the existing backend values:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The frontend and backend must use the same client ID so the backend audience
check matches the browser credential.

## Authentication flow

- The official Google button returns a short-lived Google ID token to the
  frontend.
- The frontend sends it to `POST /api/auth/google`.
- The backend verifies signature, audience, issuer, expiry, and verified
  email, then looks up the account by Google's stable `sub` identifier.
- New Google users are created as attendees and receive the normal
  EventYatwon JWT.
- Existing linked users retain their database role and user ID.
- Inactive users are rejected.

If the verified Google email already belongs to a password account, the
backend returns `GOOGLE_ACCOUNT_LINK_REQUIRED`. The user must enter that
account's password. After password authentication, the frontend calls the
protected `POST /api/auth/google/link` endpoint. Linking requires matching
verified email addresses and never changes the existing role.

## Verification

```bash
cd backend
npm test
npm run typecheck
npm run build

cd ../frontend
npm run build
```

For a manual check, use separate Google accounts to verify new attendee
creation, repeat login, password-account linking, and inactive-user rejection.
Confirm organizer and admin accounts keep their roles and that admin APIs
still reject non-admin EventYatwon JWTs.
