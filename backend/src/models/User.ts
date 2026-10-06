import { compare, hash } from "bcryptjs";
import { Schema, model, models, type Document, type Model } from "mongoose";

export type UserRole = "attendee" | "organizer" | "admin";

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  avatarPublicId?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be valid"],
      maxlength: [254, "Email cannot exceed 254 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    avatarPublicId: {
      type: String,
      trim: true,
      select: false,
      default: null,
    },
    role: {
      type: String,
      enum: ["attendee", "organizer", "admin"],
      default: "attendee",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return compare(candidatePassword, this.password);
};

export const User =
  (models.User as Model<IUser> | undefined) || model<IUser>("User", userSchema);
