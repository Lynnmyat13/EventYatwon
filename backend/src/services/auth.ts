import { createAccessToken } from "../config/auth";
import { User, type IUser, type UserRole } from "../models";
import { HttpError } from "../utils/http";
import { AVATAR_IMAGE_FOLDER, deleteImage, uploadImage } from "./images";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "attendee" | "organizer">;
}

export interface UpdateUserProfileInput {
  name: string;
  email: string;
}

interface AuthResult {
  token: string;
  user: IUser;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const registerUser = async (
  input: RegisterUserInput,
): Promise<AuthResult> => {
  const email = input.email.trim().toLowerCase();

  if (await User.exists({ email })) {
    throw new HttpError(409, "An account with this email already exists");
  }

  try {
    const user = await User.create({
      ...input,
      email,
      name: input.name.trim(),
    });
    return { token: createAccessToken(user.id, user.role), user };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "An account with this email already exists");
    }

    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password",
  );

  if (!user?.isActive || !(await user.comparePassword(password))) {
    throw new HttpError(401, "Invalid email or password");
  }

  return { token: createAccessToken(user.id, user.role), user };
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user?.isActive) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

export const updateUserProfile = async (
  userId: string,
  input: UpdateUserProfileInput,
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user?.isActive) throw new HttpError(404, "User not found");

  const email = input.email.trim().toLowerCase();
  const emailOwner = await User.exists({ email, _id: { $ne: user._id } });
  if (emailOwner) {
    throw new HttpError(409, "An account with this email already exists");
  }

  user.name = input.name.trim();
  user.email = email;
  try {
    return await user.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw error;
  }
};

export const replaceUserAvatar = async (
  userId: string,
  image: Buffer,
): Promise<IUser> => {
  const user = await User.findById(userId).select("+avatarPublicId");
  if (!user?.isActive) throw new HttpError(404, "User not found");

  const uploaded = await uploadImage(image, AVATAR_IMAGE_FOLDER);
  const previousPublicId = user.avatarPublicId;
  user.avatar = uploaded.secureUrl;
  user.avatarPublicId = uploaded.publicId;
  try {
    const saved = await user.save();
    await deleteImage(previousPublicId, AVATAR_IMAGE_FOLDER);
    return saved;
  } catch (error) {
    await deleteImage(uploaded.publicId, AVATAR_IMAGE_FOLDER);
    throw error;
  }
};

export const removeUserAvatar = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).select("+avatarPublicId");
  if (!user?.isActive) throw new HttpError(404, "User not found");
  const previousPublicId = user.avatarPublicId;
  user.avatar = undefined;
  user.avatarPublicId = undefined;
  const saved = await user.save();
  await deleteImage(previousPublicId, AVATAR_IMAGE_FOLDER);
  return saved;
};
