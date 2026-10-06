import type { IUser } from "../models";

export const toPublicUser = (user: IUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? null,
  role: user.role,
  isActive: user.isActive,
});
