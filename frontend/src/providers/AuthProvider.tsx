"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import axios from "axios";
import {
  authApi,
  type AuthUser,
  type UserAccess,
} from "@/app/api/auth.api";
import {
  AUTH_CHANGE_EVENT,
  setToken,
  setUser,
  setAccess,
  clearAuth,
  getToken,
  getUserRaw,
  getAccessRaw,
} from "@/lib/utils/storage";

type AuthSnapshot = {
  token: string | null;
  user: AuthUser | null;
  access: UserAccess | null;
};

type AuthCtx = AuthSnapshot & {
  hydrated: boolean;
  isLoading: boolean;
  login: (body: { email: string; password: string }) => Promise<AuthUser>;
  register: (body: {
    name: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

const SERVER_SNAPSHOT: AuthSnapshot = {
  token: null,
  user: null,
  access: null,
};

let lastToken: string | null = null;
let lastUserRaw: string | null = null;
let lastAccessRaw: string | null = null;

let CLIENT_SNAPSHOT: AuthSnapshot = {
  token: null,
  user: null,
  access: null,
};

function subscribeAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getClientSnapshot(): AuthSnapshot {
  const token = getToken();
  const userRaw = getUserRaw();
  const accessRaw = getAccessRaw();

  if (
    token === lastToken &&
    userRaw === lastUserRaw &&
    accessRaw === lastAccessRaw
  ) {
    return CLIENT_SNAPSHOT;
  }

  lastToken = token;
  lastUserRaw = userRaw;
  lastAccessRaw = accessRaw;

  CLIENT_SNAPSHOT = {
    token,
    user: parseJson<AuthUser>(userRaw),
    access: parseJson<UserAccess>(accessRaw),
  };

  return CLIENT_SNAPSHOT;
}

function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(
    subscribeAuth,
    getClientSnapshot,
    () => SERVER_SNAPSHOT
  );

  const [isLoading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bootRef = useRef(false);

  const hardLogout = useCallback(() => {
    clearAuth();
  }, []);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    let mounted = true;

    const bootstrap = async () => {
      setLoading(true);

      try {
        if (getToken()) {
          const me = await authApi.me();
          if (!mounted) return;

          setUser(me.user);
          setAccess(me.access);
        } else {
          const refreshed = await authApi.refresh();
          if (!mounted) return;

          setToken(refreshed.accessToken);
          setAccess(refreshed.access);

          const me = await authApi.me();
          if (!mounted) return;

          setUser(me.user);
          setAccess(me.access);
        }
      } catch (error: unknown) {
        const status = getErrorStatus(error);

        if ((status === 401 || status === 403) && mounted) {
          hardLogout();
        }
      } finally {
        if (!mounted) return;
        setLoading(false);
        setHydrated(true);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [hardLogout]);

  const refreshMe = useCallback(async () => {
    setLoading(true);

    try {
      const data = await authApi.me();
      setUser(data.user);
      setAccess(data.access);
    } catch (error: unknown) {
      const status = getErrorStatus(error);

      if (status === 401 || status === 403) {
        hardLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [hardLogout]);

  const login = useCallback(
    async (body: { email: string; password: string }) => {
      setLoading(true);

      try {
        const response = await authApi.login(body);
        setToken(response.accessToken);
        setUser(response.user);
        setAccess(response.access);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (body: { name: string; email: string; password: string }) => {
      setLoading(true);

      try {
        const response = await authApi.register(body);
        setToken(response.accessToken);
        setUser(response.user);
        setAccess(response.access);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authApi.logout();
    } finally {
      hardLogout();
      setLoading(false);
    }
  }, [hardLogout]);

  const value = useMemo<AuthCtx>(
    () => ({
      token: snap.token,
      user: snap.user,
      access: snap.access,
      hydrated,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [
      snap.token,
      snap.user,
      snap.access,
      hydrated,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthCtx {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside <AuthProvider />");
  }

  return context;
}