import { createAccessToken } from "../config/auth";
import {
  verifyGoogleIdToken,
  type GoogleTokenVerifier,
} from "../config/google";
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

const googleAccountConflict = (): HttpError =>
  new HttpError(
    409,
    "An account with this email already exists. Log in with your password to link Google.",
    "GOOGLE_ACCOUNT_LINK_REQUIRED",
  );

export const loginWithGoogle = async (
  idToken: string,
  verifyToken: GoogleTokenVerifier = verifyGoogleIdToken,
): Promise<AuthResult> => {
  const identity = await verifyToken(idToken);
  const linkedUser = await User.findOne({ googleId: identity.subject });

  if (linkedUser) {
    if (!linkedUser.isActive) {
      throw new HttpError(403, "This account is inactive");
    }
    return {
      token: createAccessToken(linkedUser.id, linkedUser.role),
      user: linkedUser,
    };
  }

  if (await User.exists({ email: identity.email })) {
    throw googleAccountConflict();
  }

  const name =
    identity.name.length >= 2
      ? identity.name.slice(0, 100)
      : "Google user";

  try {
    const user = await User.create({
      name,
      email: identity.email,
      googleId: identity.subject,
      avatar: identity.picture,
      role: "attendee",
    });
    return { token: createAccessToken(user.id, user.role), user };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const user = await User.findOne({ googleId: identity.subject });
      if (user?.isActive) {
        return { token: createAccessToken(user.id, user.role), user };
      }
      throw googleAccountConflict();
    }
    throw error;
  }
};

export const linkGoogleAccount = async (
  userId: string,
  idToken: string,
  verifyToken: GoogleTokenVerifier = verifyGoogleIdToken,
): Promise<IUser> => {
  const [identity, user] = await Promise.all([
    verifyToken(idToken),
    User.findById(userId).select("+googleId"),
  ]);

  if (!user?.isActive) throw new HttpError(404, "User not found");
  if (identity.email !== user.email) {
    throw new HttpError(
      409,
      "Google email must match your EventYatwon account email",
    );
  }
  if (user.googleId && user.googleId !== identity.subject) {
    throw new HttpError(409, "A different Google account is already linked");
  }

  const googleOwner = await User.findOne({ googleId: identity.subject });
  if (googleOwner && googleOwner.id !== user.id) {
    throw new HttpError(409, "This Google account is already linked");
  }

  user.googleId = identity.subject;
  if (!user.avatar && identity.picture) user.avatar = identity.picture;

  try {
    return await user.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "This Google account is already linked");
    }
    throw error;
  }
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
