import type { UserRole } from "@/types/auth";

export const getRoleHomePath = (role: UserRole): string => {
  if (role === "admin") return "/admin";
  if (role === "organizer") return "/events/create";
  return "/dashboard";
};
