import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/context/auth-context";
import { removePrivateQueries } from "@/lib/query-client";
import { api } from "@/services/api";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setAccessToken,
} from "@/services/auth";
import type { LoginInput, RegisterInput, User } from "@/types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    removePrivateQueries(queryClient);
  }, [queryClient]);

  useEffect(() => {
    let isActive = true;

    if (!getAccessToken()) {
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) setUser(currentUser);
      })
      .catch(() => {
        if (isActive) clearSession();
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [clearSession]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error.response as { status?: number } | undefined)?.status === 401 &&
          getAccessToken()
        ) {
          clearSession();
        }

        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await loginRequest(input);
      removePrivateQueries(queryClient);
      setAccessToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await registerRequest(input);
      removePrivateQueries(queryClient);
      setAccessToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    setUser(await getCurrentUser());
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
