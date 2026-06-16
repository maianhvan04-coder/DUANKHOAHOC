"use client";

import { type ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings,
  User2,
  X,
} from "lucide-react";
import { useStudentPreferences, type StudentMessageKey } from "@/i18n";
import AiChatWidget from "@/components/ai/AiChatWidget";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getStudentEntryPath,
  hasAnyStudentPortalPermission,
  STUDENT_PORTAL_PERMISSIONS,
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

const navItems = [
  {
    labelKey: "nav.dashboard",
    href: "/student/bang-tin",
    icon: Home,
    requiredPermissions: [
      STUDENT_PORTAL_PERMISSIONS.ACCESS,
      STUDENT_PORTAL_PERMISSIONS.DASHBOARD_READ,
    ],
    match: (pathname: string) =>
      pathname === "/student" || pathname.startsWith("/student/bang-tin"),
  },
  {
    labelKey: "nav.schedule",
    href: "/student/lich-hoc",
    icon: CalendarDays,
    requiredPermissions: [STUDENT_PORTAL_PERMISSIONS.SCHEDULE_READ],
    match: (pathname: string) => pathname.startsWith("/student/lich-hoc"),
  },
  {
    labelKey: "nav.grades",
    href: "/student/xem-diem",
    icon: BarChart3,
    requiredPermissions: [STUDENT_PORTAL_PERMISSIONS.GRADE_READ],
    match: (pathname: string) => pathname.startsWith("/student/xem-diem"),
  },
] satisfies Array<{
  labelKey: StudentMessageKey;
  href: string;
  icon: typeof Home;
  requiredPermissions: string[];
  match: (pathname: string) => boolean;
}>;

function getPageTitle(pathname: string, t: (key: StudentMessageKey) => string) {
  if (pathname.startsWith("/student/lich-hoc")) return t("nav.schedule");
  if (pathname.startsWith("/student/xem-diem")) return t("nav.grades");
  if (pathname.startsWith("/student/thong-tin-ca-nhan")) return t("nav.profile");
  if (pathname.startsWith("/student/thong-bao")) return t("nav.notifications");
  if (pathname.startsWith("/student/cai-dat")) return t("nav.settings");
  return t("nav.dashboard");
}

export default function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, access } = useAuth();
  const { t } = useStudentPreferences();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileActive = pathname.startsWith("/student/thong-tin-ca-nhan");
  const notificationsActive = pathname.startsWith("/student/thong-bao");
  const settingsActive = pathname.startsWith("/student/cai-dat");

  const avatarUrl = resolveAvatarUrl(user?.avatar);
  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) =>
        hasAnyStudentPortalPermission(access, item.requiredPermissions)
      ),
    [access]
  );
  const canViewNotifications = hasAnyStudentPortalPermission(access, [
    STUDENT_PORTAL_PERMISSIONS.NOTIFICATION_READ,
    STUDENT_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE,
  ]);
  const canViewProfile = hasAnyStudentPortalPermission(access, [
    STUDENT_PORTAL_PERMISSIONS.PROFILE_READ,
    STUDENT_PORTAL_PERMISSIONS.PROFILE_UPDATE,
  ]);
  const canViewSettings = hasAnyStudentPortalPermission(access, [
    STUDENT_PORTAL_PERMISSIONS.SETTING_READ,
    STUDENT_PORTAL_PERMISSIONS.SETTING_UPDATE,
  ]);
  const studentEntryPath = getStudentEntryPath(access);
  const canViewLearningSection =
    visibleNavItems.length > 0 || canViewNotifications;
  const userInitial = useMemo(() => {
    return (
      user?.name?.trim()?.charAt(0)?.toUpperCase() ||
      user?.email?.trim()?.charAt(0)?.toUpperCase() ||
      "H"
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
    <aside className="flex h-full w-[290px] shrink-0 flex-col border-r border-slate-200 bg-white transition-colors dark:border-white/10 dark:bg-slate-950">
      <div className="flex h-[88px] items-center justify-between border-b border-slate-100 px-5 dark:border-white/10">
        <Link href="/" className="inline-flex min-w-0 items-center">
          <Image
            src="/Logo-horizontal-clean.png"
            alt="Everest"
            width={919}
            height={241}
            className="h-auto w-[220px] shrink-0 object-contain"
            priority
          />
        </Link>

        <button
          type="button"
          onClick={closeSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:hidden"
          aria-label={t("shell.closeMenu")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/10 dark:bg-white/5">
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
              {user?.name || t("shell.student")}
            </p>
            <p className="line-clamp-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-5">
        {canViewLearningSection ? (
          <>
            <div className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {t("section.learning")}
            </div>

            <div className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = item.match(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                      active
                        ? "bg-[#EAF2FF] text-[#0D56A6] dark:bg-sky-500/15 dark:text-sky-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active
                          ? "text-[#0D56A6] dark:text-sky-200"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}

              {canViewNotifications ? (
                <Link
                  href="/student/thong-bao"
                  onClick={closeSidebar}
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                    notificationsActive
                      ? "bg-[#EAF2FF] text-[#0D56A6] dark:bg-sky-500/15 dark:text-sky-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  <Bell
                    className={cn(
                      "h-5 w-5",
                      notificationsActive
                        ? "text-[#0D56A6] dark:text-sky-200"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span>{t("nav.notifications")}</span>
                </Link>
              ) : null}
            </div>
          </>
        ) : null}

        {canViewProfile ? (
          <>
            <div className="mt-7 px-3 pb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {t("section.account")}
            </div>

            <div className="space-y-1">
              <Link
                href="/student/thong-tin-ca-nhan"
                onClick={closeSidebar}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  profileActive
                    ? "bg-[#EAF2FF] text-[#0D56A6] dark:bg-sky-500/15 dark:text-sky-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                <User2
                  className={cn(
                    "h-5 w-5",
                    profileActive
                      ? "text-[#0D56A6] dark:text-sky-200"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span>{t("nav.profile")}</span>
              </Link>
            </div>
          </>
        ) : null}

        {canViewSettings ? (
          <>
            <div className="mt-7 px-3 pb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
              {t("section.system")}
            </div>

            <div className="space-y-1">
              <Link
                href="/student/cai-dat"
                onClick={closeSidebar}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  settingsActive
                    ? "bg-[#EAF2FF] text-[#0D56A6] dark:bg-sky-500/15 dark:text-sky-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                <Settings
                  className={cn(
                    "h-5 w-5",
                    settingsActive
                      ? "text-[#0D56A6] dark:text-sky-200"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span>{t("nav.settings")}</span>
              </Link>
            </div>
          </>
        ) : null}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          {t("shell.logout")}
        </button>
      </div>
    </aside>
  );

  return (
    <div
      data-student-shell
      className="min-h-screen bg-[#F4F7FB] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
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

      <div className="lg:pl-[290px]">
        <header className="sticky top-0 z-30 flex h-[88px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors md:px-6 dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 lg:hidden"
              aria-label={t("shell.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 lg:flex dark:bg-white/10 dark:text-slate-300">
              <PanelLeftClose className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-950 md:text-2xl dark:text-white">
                {getPageTitle(pathname, t)}
              </h1>
              <p className="mt-1 hidden text-sm text-slate-500 sm:block dark:text-slate-400">
                {t("shell.subtitle")}
              </p>
            </div>
          </div>

          {studentEntryPath ? (
            <Link
              href={studentEntryPath}
              className="hidden h-10 items-center gap-2 rounded-xl bg-[#0D56A6] px-4 text-sm font-bold text-white transition hover:bg-[#0B4A8E] md:inline-flex"
            >
              <BookOpenCheck className="h-4 w-4" />
              {t("shell.student")}
            </Link>
          ) : null}
        </header>

        <div className="min-h-[calc(100vh-88px)]">{children}</div>
      </div>
      <AiChatWidget role="student" />
    </div>
  );
}
