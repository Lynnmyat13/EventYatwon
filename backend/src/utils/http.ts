import type { Response } from "express";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data === undefined ? {} : { data }),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  });
};
