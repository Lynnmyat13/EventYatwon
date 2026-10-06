import { Schema, model, models, type Document, type Types } from "mongoose";

export type EventStatus =
  "draft" | "pending" | "published" | "completed" | "cancelled";

export interface ITicketType {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface IEventVenue {
  name: string;
  address: string;
}

export interface IEvent extends Document {
  organizer: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  banner?: string;
  bannerPublicId?: string;
  startDate: Date;
  endDate: Date;
  venue: IEventVenue;
  capacity: number;
  registeredCount: number;
  ticketTypes: ITicketType[];
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema<ITicketType>(
  {
    name: {
      type: String,
      required: [true, "Ticket type name is required"],
      trim: true,
      maxlength: [80, "Ticket type name cannot exceed 80 characters"],
    },
    price: {
      type: Number,
      required: [true, "Ticket price is required"],
      min: [0, "Ticket price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Ticket quantity is required"],
      min: [0, "Ticket quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Ticket quantity must be a whole number",
      },
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Sold ticket count cannot be negative"],
    },
  },
  { _id: false },
);

const eventSchema = new Schema<IEvent>(
  {
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [160, "Title cannot exceed 160 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL friendly"],
      maxlength: [200, "Slug cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters"],
      index: true,
    },
    banner: {
      type: String,
      trim: true,
      default: null,
    },
    bannerPublicId: {
      type: String,
      trim: true,
      select: false,
      default: null,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    venue: {
      name: {
        type: String,
        required: [true, "Venue name is required"],
        trim: true,
        minlength: [2, "Venue name must be at least 2 characters"],
        maxlength: [160, "Venue name cannot exceed 160 characters"],
      },
      address: {
        type: String,
        required: [true, "Venue address is required"],
        trim: true,
        minlength: [5, "Venue address must be at least 5 characters"],
        maxlength: [300, "Venue address cannot exceed 300 characters"],
      },
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Capacity must be a whole number",
      },
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, "Registered count cannot be negative"],
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "completed", "cancelled"],
      default: "draft",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

eventSchema.set("toJSON", {
  transform: (_document, result) => {
    delete (result as { bannerPublicId?: string }).bannerPublicId;
    return result;
  },
});

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1, status: 1, startDate: 1 });
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ title: "text", description: "text", category: "text" });

eventSchema.pre("validate", function validateEventDates() {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }

  const ticketQuantity = this.ticketTypes.reduce(
    (total, ticket) => total + ticket.quantity,
    0,
  );
  if (ticketQuantity > this.capacity) {
    this.invalidate(
      "ticketTypes",
      "Total ticket quantity cannot exceed event capacity",
    );
  }

  if (this.registeredCount > this.capacity) {
    this.invalidate(
      "capacity",
      "Capacity cannot be lower than registered count",
    );
  }

  const ticketNames = this.ticketTypes.map((ticket) =>
    ticket.name.trim().toLowerCase(),
  );
  if (new Set(ticketNames).size !== ticketNames.length) {
    this.invalidate("ticketTypes", "Ticket type names must be unique");
  }

  for (const ticket of this.ticketTypes) {
    if (ticket.sold > ticket.quantity) {
      this.invalidate(
        "ticketTypes",
        "Sold ticket count cannot exceed ticket quantity",
      );
      break;
    }
  }
});

export const Event = models.Event || model<IEvent>("Event", eventSchema);
