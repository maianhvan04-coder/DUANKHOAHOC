"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  useEffect,
} from "react";
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
  hydrated: boolean;
};

type AuthCtx = AuthSnapshot & {
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
  hydrated: false,
};

let lastToken: string | null = null;
let lastUserRaw: string | null = null;
let lastAccessRaw: string | null = null;

let CLIENT_SNAPSHOT: AuthSnapshot = {
  token: null,
  user: null,
  access: null,
  hydrated: false,
};

function subscribeAuth(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_CHANGE_EVENT, cb);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, cb);
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

  let user: AuthUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AuthUser;
    } catch {
      user = null;
    }
  }

  let access: UserAccess | null = null;
  if (accessRaw) {
    try {
      access = JSON.parse(accessRaw) as UserAccess;
    } catch {
      access = null;
    }
  }

  CLIENT_SNAPSHOT = {
    token,
    user,
    access,
    hydrated: false,
  };

  return CLIENT_SNAPSHOT;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(
    subscribeAuth,
    getClientSnapshot,
    () => SERVER_SNAPSHOT
  );

  const [isLoading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const hardLogout = useCallback(() => {
    clearAuth();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await authApi.refresh();
        setToken(r.accessToken);
        setAccess(r.access);

        const me = await authApi.me();
        setUser(me.user);
        setAccess(me.access);
      } catch {
        hardLogout();
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, [hardLogout]);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      if (!getToken()) {
        const r = await authApi.refresh();
        setToken(r.accessToken);
        setAccess(r.access);
      }

      const data = await authApi.me();
      setUser(data.user);
      setAccess(data.access);
    } catch {
      hardLogout();
    } finally {
      setLoading(false);
    }
  }, [hardLogout]);

  const login = useCallback(
    async (body: { email: string; password: string }) => {
      setLoading(true);
      try {
        const res = await authApi.login(body);
        setToken(res.accessToken);
        setUser(res.user);
        setAccess(res.access);
        return res.user;
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
        const res = await authApi.register(body);
        setToken(res.accessToken);
        setUser(res.user);
        setAccess(res.access);
        return res.user;
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

  const value = useMemo(
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

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider />");
  return ctx;
}