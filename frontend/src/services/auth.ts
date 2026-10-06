import axios from "axios";
import { api, AUTH_TOKEN_KEY } from "@/services/api";
import type {
  ApiErrorResponse,
  ApiResponse,
  AuthData,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "@/types/auth";

export const getAccessToken = (): string | null =>
  localStorage.getItem(AUTH_TOKEN_KEY);

export const setAccessToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const register = async (input: RegisterInput): Promise<AuthData> => {
  const response = await api.post<ApiResponse<AuthData>>(
    "/auth/register",
    input,
  );
  return response.data.data;
};

export const login = async (input: LoginInput): Promise<AuthData> => {
  const response = await api.post<ApiResponse<AuthData>>("/auth/login", input);
  return response.data.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<{ user: User }>>("/auth/me");
  return response.data.data.user;
};

export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<User> => {
  const response = await api.patch<ApiResponse<{ user: User }>>(
    "/auth/me",
    input,
  );
  return response.data.data.user;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const replaceAvatar = async (image: File): Promise<User> => {
  const data = new FormData();
  data.append("avatar", image);
  const response = await api.post<ApiResponse<{ user: User }>>(
    "/auth/avatar",
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data.user;
};

export const removeAvatar = async (): Promise<User> => {
  const response =
    await api.delete<ApiResponse<{ user: User }>>("/auth/avatar");
  return response.data.data.user;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  if (!error.response) {
    return "Unable to reach the server. Please try again.";
  }

  return error.response.data?.message || fallback;
};
