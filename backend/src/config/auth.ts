import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../models";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return secret;
};

export const assertAuthConfiguration = (): void => {
  getJwtSecret();
};

export const createAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ role }, getJwtSecret(), {
    subject: userId,
    expiresIn: "7d",
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, getJwtSecret());

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !["attendee", "organizer", "admin"].includes(payload.role)
  ) {
    throw new Error("Invalid access token payload");
  }

  return payload as AccessTokenPayload;
};
