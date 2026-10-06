export type UserRole = "attendee" | "organizer" | "admin";
export type PublicRegistrationRole = Exclude<UserRole, "admin">;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  role: PublicRegistrationRole;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
