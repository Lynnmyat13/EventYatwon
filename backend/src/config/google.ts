import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { HttpError } from "../utils/http";

export interface GoogleIdentity {
  subject: string;
  email: string;
  name: string;
  picture?: string;
}

export type GoogleTokenVerifier = (
  idToken: string,
) => Promise<GoogleIdentity>;

const getGoogleClientId = (): string => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new HttpError(503, "Google sign-in is not configured");
  }
  return clientId;
};

const toIdentity = (payload: TokenPayload | undefined): GoogleIdentity => {
  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true ||
    !["accounts.google.com", "https://accounts.google.com"].includes(
      payload.iss,
    )
  ) {
    throw new HttpError(401, "Google account could not be verified");
  }

  return {
    subject: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
    ...(payload.picture ? { picture: payload.picture } : {}),
  };
};

export const verifyGoogleIdToken: GoogleTokenVerifier = async (idToken) => {
  try {
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken,
      audience: getGoogleClientId(),
    });
    return toIdentity(ticket.getPayload());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Invalid or expired Google credential");
  }
};
