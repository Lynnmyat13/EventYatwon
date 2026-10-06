import { randomBytes } from "node:crypto";
import { Schema, model, models, type Document, type Types } from "mongoose";

export type TicketStatus = "active" | "used" | "cancelled" | "expired";

export interface ITicket extends Document {
  registration: Types.ObjectId;
  event: Types.ObjectId;
  user: Types.ObjectId;
  ticketCode: string;
  qrToken: string;
  ticketType: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  status: TicketStatus;
  archivedByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const createTicketCode = (): string => `TICKET-${randomBytes(8).toString("hex").toUpperCase()}`;
const createQrToken = (): string => randomBytes(32).toString("hex");

const ticketSchema = new Schema<ITicket>(
  {
    registration: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: [true, "Registration is required"],
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      default: createTicketCode,
      trim: true,
      uppercase: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      default: createQrToken,
      select: false,
    },
    ticketType: {
      type: String,
      required: [true, "Ticket type is required"],
      trim: true,
      maxlength: [80, "Ticket type cannot exceed 80 characters"],
    },
    checkedIn: {
      type: Boolean,
      default: false,
      required: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "used", "cancelled", "expired"],
      default: "active",
      required: true,
      index: true,
    },
    archivedByUser: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true },
);

ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ user: 1, archivedByUser: 1, createdAt: -1 });
ticketSchema.index({ event: 1, checkedIn: 1, checkedInAt: -1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });

export const Ticket = models.Ticket || model<ITicket>("Ticket", ticketSchema);
