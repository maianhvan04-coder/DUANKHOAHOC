"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  studentMessages,
  type StudentLocale,
  type StudentMessageKey,
  type StudentTheme,
} from "../../config/config-i18n";

type StudentPreferencesContextValue = {
  locale: StudentLocale;
  theme: StudentTheme;
  setLocale: (locale: StudentLocale) => void;
  setTheme: (theme: StudentTheme) => void;
  toggleTheme: () => void;
  t: (key: StudentMessageKey) => string;
};

const StudentPreferencesContext =
  createContext<StudentPreferencesContextValue | null>(null);

const THEME_STORAGE_KEY = "student_theme";
const LOCALE_STORAGE_KEY = "student_locale";
const STORE_EVENT = "student-preferences-change";

function subscribePreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === LOCALE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_EVENT, onStoreChange);
  };
}

function readStoredTheme(): StudentTheme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function readStoredLocale(): StudentLocale {
  if (typeof window === "undefined") return "vi";

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en" || stored === "vi" ? stored : "vi";
  } catch {
    return "vi";
  }
}

export function StudentPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useSyncExternalStore<StudentTheme>(
    subscribePreferences,
    readStoredTheme,
    () => "light"
  );
  const locale = useSyncExternalStore<StudentLocale>(
    subscribePreferences,
    readStoredLocale,
    () => "vi"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.studentTheme = theme;

    return () => {
      document.documentElement.classList.remove("dark");
      delete document.documentElement.dataset.studentTheme;
    };
  }, [theme]);

  const setTheme = useCallback((nextTheme: StudentTheme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const setLocale = useCallback((nextLocale: StudentLocale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readStoredTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  const t = useCallback(
    (key: StudentMessageKey) => studentMessages[locale][key],
    [locale]
  );

  const value = useMemo<StudentPreferencesContextValue>(
    () => ({
      locale,
      theme,
      setLocale,
      setTheme,
      toggleTheme,
      t,
    }),
    [locale, theme, setLocale, setTheme, toggleTheme, t]
  );

  return (
    <StudentPreferencesContext.Provider value={value}>
      {children}
    </StudentPreferencesContext.Provider>
  );
}

export function useStudentPreferences() {
  const context = useContext(StudentPreferencesContext);

  if (!context) {
    throw new Error(
      "useStudentPreferences must be used within StudentPreferencesProvider"
    );
  }

  return context;
}
