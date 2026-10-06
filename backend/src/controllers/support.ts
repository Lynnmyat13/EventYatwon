import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import type { SupportTopic } from "../models";
import { createSupportRequest } from "../services/support";
import { HttpError, sendSuccess } from "../utils/http";

const topics: SupportTopic[] = [
  "registration",
  "tickets",
  "account",
  "events",
  "other",
];

const requiredText = (
  value: unknown,
  field: string,
  maxLength: number,
): string => {
  if (typeof value !== "string" || !value.trim())
    throw new HttpError(400, `${field} is required`);
  const text = value.trim();
  if (text.length > maxLength) throw new HttpError(400, `${field} is too long`);
  return text;
};

export const submitSupportRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const name = requiredText(req.body?.name, "name", 100);
    const email = requiredText(req.body?.email, "email", 254).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email))
      throw new HttpError(400, "email must be valid");
    const topic = req.body?.topic;
    if (typeof topic !== "string" || !topics.includes(topic as SupportTopic))
      throw new HttpError(400, "topic is invalid");
    const message = requiredText(req.body?.message, "message", 2000);
    const auth = (req as AuthenticatedRequest).auth;

    sendSuccess(
      res,
      201,
      "Support request submitted",
      await createSupportRequest({
        userId: auth?.userId,
        name,
        email,
        topic: topic as SupportTopic,
        message,
      }),
    );
  } catch (error) {
    next(error);
  }
};
