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
  linkGoogleAccount,
  login as loginRequest,
  loginWithGoogle as googleLoginRequest,
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
    async (input: LoginInput, googleCredential?: string) => {
      const data = await loginRequest(input);
      removePrivateQueries(queryClient);
      setAccessToken(data.token);
      try {
        const authenticatedUser = googleCredential
          ? await linkGoogleAccount(googleCredential)
          : data.user;
        setUser(authenticatedUser);
        return authenticatedUser;
      } catch (error) {
        clearAccessToken();
        throw error;
      }
    },
    [queryClient],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const data = await googleLoginRequest(credential);
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
      loginWithGoogle,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, loginWithGoogle, logout, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
