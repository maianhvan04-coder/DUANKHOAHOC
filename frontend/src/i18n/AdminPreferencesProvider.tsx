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
  adminMessages,
  type AdminLocale,
  type AdminMessageKey,
} from "./config";

type AdminPreferencesContextValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (key: AdminMessageKey) => string;
  translateText: (value: string) => string;
};

const AdminPreferencesContext =
  createContext<AdminPreferencesContextValue | null>(null);

const LOCALE_STORAGE_KEY = "admin_locale";
const STORE_EVENT = "admin-preferences-change";
const ATTRIBUTE_NAMES = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP_TEXT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "CODE",
  "PRE",
]);

const exactCache = new Map<AdminLocale, Map<string, string>>();
const phraseCache = new Map<AdminLocale, Array<[string, string]>>();

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

function readStoredLocale(): AdminLocale {
  if (typeof window === "undefined") return "vi";

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en" || stored === "vi" ? stored : "vi";
  } catch {
    return "vi";
  }
}

function preserveOuterWhitespace(source: string, replacement: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function buildExactMap(locale: AdminLocale) {
  const cached = exactCache.get(locale);
  if (cached) return cached;

  const targetMessages = adminMessages[locale];
  const map = new Map<string, string>();

  for (const key of Object.keys(targetMessages) as AdminMessageKey[]) {
    const target = targetMessages[key];

    for (const candidate of [adminMessages.vi[key], adminMessages.en[key]]) {
      if (candidate && candidate !== target) {
        map.set(candidate, target);
      }
    }
  }

  exactCache.set(locale, map);
  return map;
}

function buildPhraseEntries(locale: AdminLocale) {
  const cached = phraseCache.get(locale);
  if (cached) return cached;

  const targetMessages = adminMessages[locale];
  const entries: Array<[string, string]> = [];

  for (const key of Object.keys(targetMessages) as AdminMessageKey[]) {
    const target = targetMessages[key];

    for (const candidate of [adminMessages.vi[key], adminMessages.en[key]]) {
      if (candidate && candidate !== target && candidate.length >= 4) {
        entries.push([candidate, target]);
      }
    }
  }

  entries.sort((a, b) => b[0].length - a[0].length);
  phraseCache.set(locale, entries);
  return entries;
}

function translateAdminText(value: string, locale: AdminLocale) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = buildExactMap(locale).get(trimmed);
  if (exact) return preserveOuterWhitespace(value, exact);

  let next = value;

  for (const [source, target] of buildPhraseEntries(locale)) {
    if (next.includes(source)) {
      next = next.split(source).join(target);
    }
  }

  return next;
}

export function AdminPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const locale = useSyncExternalStore<AdminLocale>(
    subscribePreferences,
    readStoredLocale,
    () => "vi"
  );

  const setLocale = useCallback((nextLocale: AdminLocale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.dispatchEvent(new Event(STORE_EVENT));
    } catch {}
  }, []);

  const t = useCallback(
    (key: AdminMessageKey) => adminMessages[locale][key],
    [locale]
  );

  const translateText = useCallback(
    (value: string) => translateAdminText(value, locale),
    [locale]
  );

  const value = useMemo<AdminPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      translateText,
    }),
    [locale, setLocale, t, translateText]
  );

  return (
    <AdminPreferencesContext.Provider value={value}>
      {children}
    </AdminPreferencesContext.Provider>
  );
}

export function AdminAutoTranslator() {
  const { translateText } = useAdminPreferences();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.querySelector("[data-admin-shell]") ?? document.body;

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (parent && SKIP_TEXT_TAGS.has(parent.tagName)) return;

      const next = translateText(node.nodeValue ?? "");
      if (next !== node.nodeValue) node.nodeValue = next;
    };

    const translateAttributes = (element: Element) => {
      if (SKIP_TEXT_TAGS.has(element.tagName)) return;

      for (const name of ATTRIBUTE_NAMES) {
        const current = element.getAttribute(name);
        if (!current) continue;

        const next = translateText(current);
        if (next !== current) element.setAttribute(name, next);
      }
    };

    const translateTree = () => {
      translateAttributes(root as Element);

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        translateTextNode(node as Text);
        node = walker.nextNode();
      }

      root.querySelectorAll("*").forEach(translateAttributes);
      document.title = translateText(document.title);
    };

    let frame = 0;
    const scheduleTranslate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(translateTree);
    };

    scheduleTranslate();

    const observer = new MutationObserver(scheduleTranslate);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTE_NAMES],
    });

    const originalAlert = window.alert.bind(window);
    const originalConfirm = window.confirm.bind(window);

    window.alert = (message?: unknown) => {
      originalAlert(translateText(String(message ?? "")));
    };

    window.confirm = (message?: unknown) =>
      originalConfirm(translateText(String(message ?? "")));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, [translateText]);

  return null;
}

export function useAdminPreferences() {
  const context = useContext(AdminPreferencesContext);

  if (!context) {
    throw new Error(
      "useAdminPreferences must be used within AdminPreferencesProvider"
    );
  }

  return context;
}
