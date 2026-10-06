import { Schema, model, models, type Document, type Types } from "mongoose";

export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "refunded";

export interface IRegistration extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  ticketType: string;
  quantity: number;
  status: RegistrationStatus;
  archivedByUser: boolean;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
      index: true,
    },
    ticketType: {
      type: String,
      required: [true, "Ticket type is required"],
      trim: true,
      maxlength: [80, "Ticket type cannot exceed 80 characters"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    archivedByUser: {
      type: Boolean,
      default: false,
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true },
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1, registeredAt: -1 });
registrationSchema.index({ user: 1, registeredAt: -1 });
registrationSchema.index({ user: 1, archivedByUser: 1, registeredAt: -1 });
registrationSchema.index({ createdAt: -1 });

export const Registration =
  models.Registration || model<IRegistration>("Registration", registrationSchema);
