"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Globe, Menu, Moon, Sun } from "lucide-react";
import { notificationApi } from "@/app/api/notification.api";
import { useAdminLayout } from "@/components/layouts/admin/admin-layout-context";
import AvatarMenu from "@/components/layouts/admin/topbar/AvatarMenu";
import { NOTIFICATION_CHANGED_EVENT } from "@/lib/utils/notification-events";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";
import {
  ADMIN_LOCALES,
  useAdminPreferences,
  type AdminMessageKey,
} from "@/i18n";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ADMIN_PAGE_TITLES = [
  { path: "/admin/dashboard", titleKey: "page.dashboard" },
  { path: "/admin/users", titleKey: "page.users" },
  { path: "/admin/students", titleKey: "page.students" },
  { path: "/admin/teachers", titleKey: "page.teachers" },
  { path: "/admin/course", titleKey: "page.course" },
  { path: "/admin/classes", titleKey: "page.classes" },
  { path: "/admin/schedule", titleKey: "page.schedule" },
  { path: "/admin/blog", titleKey: "page.blog" },
  { path: "/admin/notification", titleKey: "page.notification" },
  { path: "/admin/my-notifications", titleKey: "page.myNotifications" },
  { path: "/admin/rbac", titleKey: "page.rbac" },
  { path: "/admin/payment-audits", titleKey: "page.paymentAudits" },
  { path: "/admin/security-audits", titleKey: "page.securityAudits" },
  { path: "/admin/setting", titleKey: "page.setting" },
] as const satisfies Array<{ path: string; titleKey: AdminMessageKey }>;

function getAdminPageTitle(pathname: string): AdminMessageKey {
  if (pathname === "/admin") return "page.dashboard";

  const match = ADMIN_PAGE_TITLES.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return match?.titleKey ?? "common.admin";
}

function LocaleFlag({ code }: { code: "vi" | "en" }) {
  if (code === "vi") {
    return (
      <span
        aria-hidden="true"
        className="relative inline-flex h-[18px] w-[28px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#DA251D] shadow-sm ring-1 ring-slate-200"
      >
        <span className="text-[10px] leading-none text-[#FFDE00]">★</span>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-[18px] w-[28px] shrink-0 overflow-hidden rounded-[4px] bg-white shadow-sm ring-1 ring-slate-200"
    >
      <span
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, #B22234 0 2px, #fff 2px 4px)",
        }}
      />
      <span className="absolute left-0 top-0 h-[10px] w-[13px] bg-[#3C3B6E]">
        <span className="absolute left-[2px] top-[1px] text-[5px] leading-none text-white">
          ★
        </span>
      </span>
    </span>
  );
}

function AdminLanguageSwitcher({ dark }: { dark: boolean }) {
  const { locale, setLocale, t } = useAdminPreferences();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border transition",
          dark
            ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
            : "border-black/8 bg-white text-slate-700 hover:bg-slate-50"
        )}
        aria-label={t("language.label")}
        aria-expanded={open}
      >
        <Globe className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+10px)] z-[100] w-[170px] overflow-hidden rounded-xl border py-1 shadow-[0_16px_42px_rgba(15,23,42,0.18)] transition-all duration-200",
          dark
            ? "border-white/10 bg-[#111827]"
            : "border-slate-200 bg-white",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        )}
      >
        {ADMIN_LOCALES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => {
              setLocale(item.code);
              setOpen(false);
            }}
            className={cn(
              "flex h-11 w-full items-center gap-3 px-4 text-left text-[14px] font-semibold transition",
              locale === item.code
                ? dark
                  ? "bg-white/10 text-white"
                  : "bg-[#F5F9FF] text-[#0D56A6]"
                : dark
                  ? "text-slate-200 hover:bg-white/10"
                  : "text-slate-700 hover:bg-[#F5F9FF]"
            )}
          >
            <LocaleFlag code={item.code} />
            <span>{t(item.nameKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminTopbar() {
  const { collapsed, toggleCollapsed } = useAdminLayout();
  const { theme, toggleTheme } = useAdminTheme();
  const { t } = useAdminPreferences();
  const pathname = usePathname();
  const dark = theme === "dark";
  const title = t(getAdminPageTitle(pathname));
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationApi.getMine({
        page: 1,
        limit: 1,
        isRead: "false",
      });
      setUnreadCount(result.data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUnreadCount();
    }, 0);

    const handleChanged = () => {
      void loadUnreadCount();
    };

    window.addEventListener(NOTIFICATION_CHANGED_EVENT, handleChanged);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(NOTIFICATION_CHANGED_EVENT, handleChanged);
    };
  }, [loadUnreadCount]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center border-b px-4 shadow-sm md:px-5",
        dark
          ? "border-white/10 bg-[#111827]/95 shadow-black/20 backdrop-blur"
          : "border-slate-200 bg-white/95 shadow-black/5 backdrop-blur"
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
              dark
                ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
            aria-label={
              collapsed ? t("common.openSidebar") : t("common.closeSidebar")
            }
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <h1
            className={cn(
              "min-w-0 truncate text-lg font-bold tracking-tight sm:text-xl",
              dark ? "text-white" : "text-slate-950"
            )}
          >
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border transition",
                dark
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-black/8 bg-white text-slate-700"
              )}
              aria-label={
                dark ? t("common.lightMode") : t("common.darkMode")
              }
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link
              href="/admin/my-notifications"
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full border transition",
                dark
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-black/8 bg-white text-slate-700"
              )}
              aria-label={t("common.notificationsMine")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1677ff] px-1 text-[10px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>

            <AdminLanguageSwitcher dark={dark} />
          </div>

          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
