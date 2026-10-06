import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  getUserById,
  loginUser,
  registerUser,
  removeUserAvatar,
  replaceUserAvatar,
  updateUserProfile,
} from "../services/auth";
import { HttpError, sendSuccess } from "../utils/http";
import { toPublicUser } from "../utils/user";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const { name, email, password, role } = body ?? {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email) ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      throw new HttpError(
        400,
        "Valid name, email, password, and role are required",
      );
    }

    const passwordBytes = Buffer.byteLength(password, "utf8");
    if (passwordBytes < 8 || passwordBytes > 72) {
      throw new HttpError(400, "Password must be between 8 and 72 bytes");
    }

    if (!PASSWORD_PATTERN.test(password)) {
      throw new HttpError(
        400,
        "Password must include uppercase, lowercase, and numeric characters",
      );
    }

    if (role !== "attendee" && role !== "organizer") {
      throw new HttpError(400, "Role must be attendee or organizer");
    }

    const result = await registerUser({ name, email, password, role });
    sendSuccess(res, 201, "Registration successful", {
      token: result.token,
      user: toPublicUser(result.user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const { email, password } = body ?? {};

    if (
      typeof email !== "string" ||
      !EMAIL_PATTERN.test(email) ||
      typeof password !== "string" ||
      password.length === 0
    ) {
      throw new HttpError(400, "Valid email and password are required");
    }

    const result = await loginUser(email, password);
    sendSuccess(res, 200, "Login successful", {
      token: result.token,
      user: toPublicUser(result.user),
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth) {
      throw new HttpError(401, "Authentication required");
    }

    const user = await getUserById(auth.userId);
    sendSuccess(res, 200, "Authenticated user retrieved", {
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw new HttpError(401, "Authentication required");

    const body = req.body as Record<string, unknown> | undefined;
    const { name, email } = body ?? {};
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email.trim())
    ) {
      throw new HttpError(400, "Valid name and email are required");
    }

    const user = await updateUserProfile(auth.userId, { name, email });
    sendSuccess(res, 200, "Profile updated", { user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  sendSuccess(res, 200, "Logout successful");
};

export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw new HttpError(401, "Authentication required");
    if (!req.file) throw new HttpError(400, "Avatar image is required");
    const user = await replaceUserAvatar(auth.userId, req.file.buffer);
    sendSuccess(res, 200, "Avatar updated", { user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const deleteAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw new HttpError(401, "Authentication required");
    const user = await removeUserAvatar(auth.userId);
    sendSuccess(res, 200, "Avatar removed", { user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};
