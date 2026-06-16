"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type AdminLayoutContextType = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
};

const AdminLayoutContext = createContext<AdminLayoutContextType | null>(null);

const STORAGE_KEY = "admin-collapsed";
const STORE_EVENT = "admin-collapsed-change";

function readCollapsed() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
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

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const setCollapsed: Dispatch<SetStateAction<boolean>> = useCallback((next) => {
    const prev = readCollapsed();
    const value =
      typeof next === "function"
        ? (next as (prevState: boolean) => boolean)(prev)
        : next;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  const value = useMemo<AdminLayoutContextType>(
    () => ({
      collapsed,
      toggleCollapsed,
      setCollapsed,
    }),
    [collapsed, toggleCollapsed, setCollapsed]
  );

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);

  if (!ctx) {
    throw new Error("useAdminLayout must be used inside AdminLayoutProvider");
  }

  return ctx;
}