"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type AdminTheme = "light" | "dark";

type ThemeCtxValue = {
  theme: AdminTheme;
  setTheme: (t: AdminTheme) => void;
  toggleTheme: () => void;
};

const ThemeCtx = createContext<ThemeCtxValue | null>(null);

const STORAGE_KEY = "admin_theme";
const STORE_EVENT = "admin-theme-change";

function readTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };

  const onCustom = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORE_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_EVENT, onCustom);
  };
}

function applyToHtml(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore<AdminTheme>(
    subscribe,
    readTheme,
    () => "light"
  );

  const setTheme = useCallback((nextTheme: AdminTheme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const current: AdminTheme = readTheme();
    const next: AdminTheme = current === "dark" ? "light" : "dark";

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  useEffect(() => {
    applyToHtml(theme);
  }, [theme]);

  const value = useMemo<ThemeCtxValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(ThemeCtx);

  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }

  return ctx;
}