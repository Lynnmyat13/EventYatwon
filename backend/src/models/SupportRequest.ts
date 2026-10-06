import { Schema, model, models, type Document, type Types } from "mongoose";

export type SupportTopic =
  "registration" | "tickets" | "account" | "events" | "other";

export interface ISupportRequest extends Document {
  user?: Types.ObjectId;
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
  status: "open" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const supportRequestSchema = new Schema<ISupportRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    topic: {
      type: String,
      enum: ["registration", "tickets", "account", "events", "other"],
      required: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      required: true,
    },
  },
  { timestamps: true },
);

supportRequestSchema.index({ status: 1, createdAt: -1 });
supportRequestSchema.index({ email: 1, createdAt: -1 });

export const SupportRequest =
  models.SupportRequest ||
  model<ISupportRequest>("SupportRequest", supportRequestSchema);
