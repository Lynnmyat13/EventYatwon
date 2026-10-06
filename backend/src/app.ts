import "dotenv/config";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { MulterError } from "multer";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import eventRouter from "./routes/events";
import favoriteRouter from "./routes/favorites";
import notificationRouter from "./routes/notifications";
import organizerRouter from "./routes/organizers";
import registrationRouter from "./routes/registrations";
import supportRouter from "./routes/support";
import reviewRouter from "./routes/reviews";
import ticketRouter from "./routes/tickets";
import { HttpError, sendError } from "./utils/http";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/events", eventRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/organizers", organizerRouter);
app.use("/api/registrations", registrationRouter);
app.use("/api/support", supportRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/tickets", ticketRouter);

app.use((_req: Request, res: Response) => {
  sendError(res, 404, "Route not found");
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof MulterError) {
    sendError(
      res,
      400,
      error.code === "LIMIT_FILE_SIZE"
        ? "Image file is too large"
        : "Invalid image upload",
    );
    return;
  }
  if (error instanceof HttpError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  if (error instanceof Error && error.name === "ValidationError") {
    sendError(res, 400, "Invalid request data");
    return;
  }

  console.error(error);
  sendError(res, 500, "Internal server error");
});

export default app;
