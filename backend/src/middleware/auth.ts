import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../config/auth";
import { User, type UserRole } from "../models";
import { sendError } from "../utils/http";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: UserRole;
  };
}

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    next();
    return;
  }

  if (!authorization.startsWith("Bearer ")) {
    sendError(res, 401, "Invalid or expired access token");
    return;
  }

  let userId: string;

  try {
    userId = verifyAccessToken(authorization.slice(7)).sub;
  } catch {
    sendError(res, 401, "Invalid or expired access token");
    return;
  }

  try {
    const user = await User.findById(userId).select("role isActive");

    if (!user?.isActive) {
      sendError(res, 401, "Authentication required");
      return;
    }

    (req as AuthenticatedRequest).auth = {
      userId: user.id,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    sendError(res, 401, "Authentication required");
    return;
  }

  let userId: string;

  try {
    userId = verifyAccessToken(authorization.slice(7)).sub;
  } catch {
    sendError(res, 401, "Invalid or expired access token");
    return;
  }

  try {
    const user = await User.findById(userId).select("role isActive");

    if (!user?.isActive) {
      sendError(res, 401, "Authentication required");
      return;
    }

    (req as AuthenticatedRequest).auth = {
      userId: user.id,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth) {
      sendError(res, 401, "Authentication required");
      return;
    }

    if (!roles.includes(auth.role)) {
      sendError(res, 403, "You do not have permission to access this resource");
      return;
    }

    next();
  };
