"use client";

import { type ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Globe,
  Home,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Settings,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import AiChatWidget from "@/components/ai/AiChatWidget";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  hasAnyTeacherPortalPermission,
  TEACHER_PORTAL_PERMISSIONS,
} from "@/lib/helpers/auth/access";
import { clearAuth } from "@/lib/utils/storage";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return avatar;
}

const navGroups = [
  {
    title: "GIÁO VIÊN",
    items: [
      {
        label: "Bảng tin",
        href: "/teacher/bang-tin",
        icon: Home,
        requiredPermissions: [
          TEACHER_PORTAL_PERMISSIONS.ACCESS,
          TEACHER_PORTAL_PERMISSIONS.DASHBOARD_READ,
        ],
        match: (pathname: string) =>
          pathname === "/teacher" || pathname.startsWith("/teacher/bang-tin"),
      },
    ],
  },
  {
    title: "GIẢNG DẠY",
    items: [
      {
        label: "Lịch dạy",
        href: "/teacher/lich-day",
        icon: CalendarDays,
        requiredPermissions: [TEACHER_PORTAL_PERMISSIONS.SCHEDULE_READ],
        match: (pathname: string) => pathname.startsWith("/teacher/lich-day"),
      },
      {
        label: "Lớp học",
        href: "/teacher/lop-hoc",
        icon: UsersRound,
        requiredPermissions: [
          TEACHER_PORTAL_PERMISSIONS.CLASS_READ,
          TEACHER_PORTAL_PERMISSIONS.CLASS_CREATE,
          TEACHER_PORTAL_PERMISSIONS.CLASS_UPDATE,
          TEACHER_PORTAL_PERMISSIONS.CLASS_CHANGE_STATUS,
          TEACHER_PORTAL_PERMISSIONS.STUDENT_UPDATE,
        ],
        match: (pathname: string) => pathname.startsWith("/teacher/lop-hoc"),
      },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      {
        label: "Thông báo",
        href: "/teacher/thong-bao",
        icon: Bell,
        requiredPermissions: [
          TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_READ,
          TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE,
        ],
        match: (pathname: string) => pathname.startsWith("/teacher/thong-bao"),
      },
      {
        label: "Cài đặt",
        href: "/teacher/cai-dat",
        icon: Settings,
        requiredPermissions: [
          TEACHER_PORTAL_PERMISSIONS.SETTING_READ,
          TEACHER_PORTAL_PERMISSIONS.SETTING_UPDATE,
        ],
        match: (pathname: string) => pathname.startsWith("/teacher/cai-dat"),
      },
    ],
  },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/teacher/lich-day")) return "Lịch dạy";
  if (pathname.startsWith("/teacher/lop-hoc")) return "Class Management";
  if (pathname.startsWith("/teacher/thong-bao")) return "Thông báo";
  if (pathname.startsWith("/teacher/cai-dat")) return "Cài đặt";
  return "Bảng tin";
}

export default function TeacherShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, access } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const avatarUrl = resolveAvatarUrl(user?.avatar);
  const visibleNavGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            hasAnyTeacherPortalPermission(access, item.requiredPermissions)
          ),
        }))
        .filter((group) => group.items.length > 0),
    [access]
  );
  const canViewNotifications = hasAnyTeacherPortalPermission(access, [
    TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_READ,
    TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE,
  ]);

  const userInitial = useMemo(() => {
    return (
      user?.name?.trim()?.charAt(0)?.toUpperCase() ||
      user?.email?.trim()?.charAt(0)?.toUpperCase() ||
      "G"
    );
  }, [user?.email, user?.name]);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  const sidebar = (
    <aside className="flex h-full w-[350px] shrink-0 flex-col border-r border-slate-200 bg-white transition-colors dark:border-white/10 dark:bg-slate-950">
      <div className="flex h-[88px] items-center justify-between border-b border-slate-100 px-5 dark:border-white/10">
        <Link href="/" className="inline-flex min-w-0 items-center">
          <Image
            src="/Logo-horizontal-clean.png"
            alt="Everest"
            width={919}
            height={241}
            className="h-auto w-[300px] shrink-0 object-contain"
            priority
          />
        </Link>

        <button
          type="button"
          onClick={closeSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/10 dark:bg-white/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#0B2C5F] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-sky-100 dark:ring-white/10">
            {avatarUrl ? (
              <span
                aria-label={user?.name || "Avatar"}
                role="img"
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              <span className="text-sm font-bold">{userInitial}</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-bold text-slate-950 dark:text-white">
              {user?.name || "Giáo viên"}
            </p>
            <p className="line-clamp-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pb-5">
        {visibleNavGroups.map((group) => (
          <div key={group.title} className="mb-7">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              {group.title}
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.match(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex h-14 items-center gap-4 rounded-lg px-4 text-base font-semibold transition",
                      active
                        ? "bg-[#EAF2FF] text-[#0D56A6] dark:bg-sky-500/15 dark:text-sky-200"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-white text-[#1677FF] shadow-sm dark:bg-slate-900 dark:text-sky-200"
                          : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-5 dark:border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-full items-center gap-4 rounded-lg px-4 text-base font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
            <LogOut className="h-5 w-5" />
          </span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );

  return (
    <div
      data-teacher-shell
      className={cn(
        "min-h-screen bg-[#F4F7FB] text-slate-900 transition-colors",
        darkMode && "dark bg-slate-950 text-slate-100"
      )}
    >
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/40 transition lg:hidden",
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
        onClick={closeSidebar}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </div>

      <div className="lg:pl-[350px]">
        <header className="sticky top-0 z-30 flex h-[88px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors md:px-6 dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 lg:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <PanelLeftClose className="h-5 w-5" />
            </div>

            <h1 className="truncate text-xl font-bold text-slate-950 md:text-2xl dark:text-white">
              {getPageTitle(pathname)}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label={darkMode ? "Tắt giao diện tối" : "Bật giao diện tối"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {canViewNotifications ? (
              <Link
                href="/teacher/thong-bao"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" />
              </Link>
            ) : null}

            <button
              type="button"
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Ngôn ngữ"
            >
              <Globe className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1677FF] text-base font-bold text-white">
              {avatarUrl ? (
                <span
                  aria-label={user?.name || "Avatar"}
                  role="img"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
              ) : (
                userInitial
              )}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-88px)]">{children}</main>
      </div>

      <AiChatWidget role="teacher" />
    </div>
  );
}
