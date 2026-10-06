import { createContext } from "react";
import type { LoginInput, RegisterInput, User } from "@/types/auth";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
