import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IFavorite extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
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
  },
  { timestamps: true },
);

favoriteSchema.index({ user: 1, event: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });
favoriteSchema.index({ event: 1, createdAt: -1 });

export const Favorite = models.Favorite || model<IFavorite>("Favorite", favoriteSchema);
