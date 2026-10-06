import { Schema, model, models, type Document, type Types } from "mongoose";

export type NotificationType =
  | "registration"
  | "ticket"
  | "event_update"
  | "reminder"
  | "system";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  event?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["registration", "ticket", "event_update", "reminder", "system"],
      required: [true, "Notification type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [160, "Notification title cannot exceed 160 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Notification message cannot exceed 1000 characters"],
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ event: 1, createdAt: -1 });

export const Notification =
  models.Notification || model<INotification>("Notification", notificationSchema);
