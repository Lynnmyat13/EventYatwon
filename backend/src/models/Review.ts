import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, event: 1 }, { unique: true });
reviewSchema.index({ event: 1, createdAt: -1 });

export const Review = models.Review || model<IReview>("Review", reviewSchema);
