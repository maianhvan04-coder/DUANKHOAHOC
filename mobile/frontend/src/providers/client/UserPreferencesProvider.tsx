"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  userMessages,
  type UserLocale,
  type UserMessageKey,
} from "../../config/config-i18n";

type UserPreferencesContextValue = {
  locale: UserLocale;
  setLocale: (locale: UserLocale) => void;
  t: (key: UserMessageKey) => string;
};

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

const LOCALE_STORAGE_KEY = "user_locale";
const STORE_EVENT = "user-preferences-change";

function subscribePreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_EVENT, onStoreChange);
  };
}

function readStoredLocale(): UserLocale {
  if (typeof window === "undefined") return "vi";

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en" || stored === "vi" ? stored : "vi";
  } catch {
    return "vi";
  }
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<UserLocale>(
    subscribePreferences,
    readStoredLocale,
    () => "vi"
  );

  const setLocale = useCallback((nextLocale: UserLocale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const t = useCallback(
    (key: UserMessageKey) => userMessages[locale][key],
    [locale]
  );

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);

  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    );
  }

  return context;
}
