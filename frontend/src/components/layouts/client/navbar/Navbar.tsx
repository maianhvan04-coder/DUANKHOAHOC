"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BrickWallShield,
  CheckCircle2,
  GraduationCap,
  Globe,
  Heart,
  Info,
  Loader2,
  LogOut,
  Search,
  User,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { clearToken, clearUser } from "@/lib/utils/storage";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  canAccessStudentPortal,
  hasAnyRole,
} from "@/lib/helpers/auth/access";
import {
  notificationApi,
  type NotificationItem,
  type NotificationType,
} from "@/app/api/notification.api";
import {
  emitNotificationChanged,
  NOTIFICATION_CHANGED_EVENT,
} from "@/lib/utils/notification-events";
import {
  USER_LOCALES,
  useUserPreferences,
  type UserMessageKey,
} from "@/i18n";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return avatar;
}

const MENU = [
  { labelKey: "nav.intro", href: "/gioi-thieu" },
  { labelKey: "nav.programs", href: "/chuong-trinh-hoc" },
  { labelKey: "nav.teachers", href: "/giang-vien" },
  { labelKey: "nav.students", href: "/hoc-vien" },
  { labelKey: "nav.knowledge", href: "/goc-kien-thuc" },
] satisfies Array<{ labelKey: UserMessageKey; href: string }>;

const FAVORITE_STORAGE_KEY = "favorite_course_ids";
const FAVORITE_EVENT = "favorite-courses-change";

const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; icon: LucideIcon; iconClass: string; badgeClass: string }
> = {
  INFO: {
    label: "Thông tin",
    icon: Info,
    iconClass: "bg-blue-50 text-blue-700",
    badgeClass: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  SUCCESS: {
    label: "Thành công",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  WARNING: {
    label: "Cảnh báo",
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-700",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  ERROR: {
    label: "Lỗi",
    icon: XCircle,
    iconClass: "bg-rose-50 text-rose-700",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-100",
  },
};

const NOTIFICATION_TYPE_LABEL_KEYS: Record<NotificationType, UserMessageKey> = {
  INFO: "notifications.type.info",
  SUCCESS: "notifications.type.success",
  WARNING: "notifications.type.warning",
  ERROR: "notifications.type.error",
};

function readFavoriteCourseCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string").length
      : 0;
  } catch {
    return 0;
  }
}

function formatNotificationDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getNotificationPreview(message: string) {
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > 112 ? `${text.slice(0, 112)}...` : text;
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

function LanguageSwitcher({ className }: { className: string }) {
  const { locale, setLocale, t } = useUserPreferences();
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
        className={className}
        aria-label={t("language.label")}
        aria-expanded={open}
      >
        <Globe className="h-5 w-5" strokeWidth={2} />
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+10px)] z-[100] w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_16px_42px_rgba(15,23,42,0.14)] transition-all duration-200",
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        )}
      >
        {USER_LOCALES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => {
              setLocale(item.code);
              setOpen(false);
            }}
            className={cn(
              "flex h-11 w-full items-center gap-3 px-4 text-left text-[14px] font-semibold transition hover:bg-[#F5F9FF]",
              locale === item.code
                ? "bg-[#F5F9FF] text-[#0D56A6]"
                : "text-slate-700"
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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

  const { t } = useUserPreferences();
  const { user, access, hydrated, isLoading } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationItems, setNotificationItems] = useState<
    NotificationItem[]
  >([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [readingNotificationId, setReadingNotificationId] = useState<
    string | null
  >(null);
  const [favoriteCourseCount, setFavoriteCourseCount] = useState(0);

  const checkingAuth = !hydrated || isLoading;
  const isLoggedIn = !!user;

  const canAccessAdmin = hasAnyRole(access, ["ADMIN", "MANAGER", "TEACHER"]);
  const canAccessStudent = canAccessStudentPortal(access);

  const loadNotificationSummary = useCallback(async () => {
    if (checkingAuth || !isLoggedIn) {
      setUnreadCount(0);
      setNotificationItems([]);
      setNotificationError("");
      return;
    }

    try {
      setNotificationLoading(true);
      setNotificationError("");
      const result = await notificationApi.getMine({
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const data = result.data;
      setUnreadCount(data.unreadCount || 0);
      setNotificationItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setUnreadCount(0);
      setNotificationItems([]);
      setNotificationError(t("notifications.loadError"));
    } finally {
      setNotificationLoading(false);
    }
  }, [checkingAuth, isLoggedIn, t]);

  useEffect(() => {
    let rafId = 0;

    const updateScroll = () => {
      const next = window.scrollY > 80;
      setScrolled((prev) => (prev !== next ? next : prev));
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateScroll);
    };

    updateScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setOpenProfileMenu(false);
      }

      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(target)
      ) {
        setOpenNotificationMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenProfileMenu(false);
        setOpenNotificationMenu(false);
        setSelectedNotification(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    void loadNotificationSummary();
  }, [loadNotificationSummary, pathname]);

  useEffect(() => {
    const syncFavoriteCourseCount = () => {
      setFavoriteCourseCount(readFavoriteCourseCount());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITE_STORAGE_KEY) syncFavoriteCourseCount();
    };

    syncFavoriteCourseCount();
    window.addEventListener(FAVORITE_EVENT, syncFavoriteCourseCount);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FAVORITE_EVENT, syncFavoriteCourseCount);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleNotificationChanged = () => {
      void loadNotificationSummary();
    };

    window.addEventListener(
      NOTIFICATION_CHANGED_EVENT,
      handleNotificationChanged
    );

    return () => {
      window.removeEventListener(
        NOTIFICATION_CHANGED_EVENT,
        handleNotificationChanged
      );
    };
  }, [loadNotificationSummary]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      clearToken();
      clearUser();
      setOpenProfileMenu(false);
      setOpenNotificationMenu(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleNotificationMenu = () => {
    const nextOpen = !openNotificationMenu;
    setOpenNotificationMenu(nextOpen);
    setOpenProfileMenu(false);

    if (nextOpen) {
      void loadNotificationSummary();
    }
  };

  const openNotificationDetail = async (item: NotificationItem) => {
    setSelectedNotification(item);
    setOpenNotificationMenu(false);

    if (item.isRead) return;

    try {
      setReadingNotificationId(item._id);
      const result = await notificationApi.markAsRead(item._id);
      const nextReadAt = result.data.readAt || new Date().toISOString();
      const nextItem: NotificationItem = {
        ...item,
        ...result.data,
        isRead: true,
        readAt: nextReadAt,
      };

      setSelectedNotification(nextItem);
      setNotificationItems((prev) =>
        prev.map((current) => (current._id === item._id ? nextItem : current))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      emitNotificationChanged();
    } catch {
      setNotificationError(t("notifications.updateReadError"));
    } finally {
      setReadingNotificationId(null);
    }
  };

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "Q";

  const userAvatar = resolveAvatarUrl(user?.avatar);

  return (
    <>
      <div aria-hidden="true" className="h-[160px]" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="relative h-[160px] w-full">
          <div
            className={cn(
              "pointer-events-auto absolute inset-x-0 top-0 z-40 border-b border-slate-200 bg-white",
              "transition-[opacity,transform] duration-300 will-change-transform",
              scrolled
                ? "pointer-events-none -translate-y-full opacity-0"
                : "translate-y-0 opacity-100"
            )}
          >
            <div className="mx-auto flex h-[82px] max-w-[1240px] items-center gap-4 px-4 md:px-6">
              <div className="flex shrink-0 items-center gap-3 text-[#0B2C5F] lg:min-w-[180px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[14px]">
                  ☎
                </span>
                <span className="whitespace-nowrap text-[14px] font-semibold">
                  1900636929
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mx-auto flex h-12 w-full max-w-[560px] items-center rounded-2xl border border-slate-300 bg-white px-4">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("search.placeholder")}
                    className="ml-3 w-full min-w-0 bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 text-[#0B2C5F] lg:min-w-[260px]">
                {checkingAuth ? (
                  <div className="h-12 w-[180px]" />
                ) : !isLoggedIn ? (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex h-12 min-w-[132px] items-center justify-center rounded-xl border border-[#0D56A6] bg-white px-5 text-[14px] font-semibold text-[#0D56A6] transition hover:bg-[#F5F9FF]"
                    >
                      {t("auth.login")}
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex h-12 min-w-[120px] items-center justify-center rounded-xl bg-[#0D56A6] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0B4A8E]"
                    >
                      {t("auth.register")}
                    </Link>

                    <LanguageSwitcher className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#0D56A6] text-[#0D56A6] transition hover:bg-[#0D56A6] hover:text-white" />
                  </>
                ) : (
                  <>
                    <div ref={notificationMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleNotificationMenu}
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                        aria-label={t("notifications.label")}
                        aria-expanded={openNotificationMenu}
                      >
                        <Bell className="h-6 w-6" strokeWidth={2} />
                        {unreadCount > 0 ? (
                          <span
                            key={unreadCount}
                            className="notification-count-badge absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0B2C5F] bg-white px-1 text-[11px] font-black leading-none text-[#0B2C5F] shadow-[0_4px_10px_rgba(15,23,42,0.18)]"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </button>

                      <div
                        className={cn(
                          "absolute right-0 top-[calc(100%+14px)] z-[95] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] transition-all duration-200",
                          openNotificationMenu
                            ? "visible translate-y-0 opacity-100"
                            : "invisible -translate-y-1 opacity-0"
                        )}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-[15px] font-bold text-[#0B2C5F]">
                              {t("notifications.title")}
                            </p>
                            <p className="mt-0.5 text-[12px] text-slate-500">
                              {unreadCount > 0
                                ? `${unreadCount} ${t("notifications.unreadSummary")}`
                                : t("notifications.noNew")}
                            </p>
                          </div>

                          <Link
                            href="/thong-bao"
                            onClick={() => setOpenNotificationMenu(false)}
                            className="text-[12px] font-bold text-[#0D56A6] hover:underline"
                          >
                            {t("notifications.viewAll")}
                          </Link>
                        </div>

                        <div className="max-h-[390px] overflow-y-auto p-2">
                          {notificationLoading ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-semibold text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("notifications.loading")}
                            </div>
                          ) : notificationError ? (
                            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                              {notificationError}
                            </div>
                          ) : notificationItems.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                                <Bell className="h-5 w-5" />
                              </div>
                              <p className="mt-3 text-sm font-bold text-slate-700">
                                {t("notifications.emptyTitle")}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {t("notifications.emptyDescription")}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {notificationItems.map((item) => {
                                const meta = NOTIFICATION_TYPE_META[item.type];
                                const Icon = meta.icon;

                                return (
                                  <button
                                    key={item._id}
                                    type="button"
                                    onClick={() =>
                                      void openNotificationDetail(item)
                                    }
                                    className={cn(
                                      "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F5F9FF]",
                                      !item.isRead && "bg-blue-50/70"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                        meta.iconClass
                                      )}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                      <span className="flex items-center gap-2">
                                        <span className="line-clamp-1 text-[13px] font-bold text-slate-900">
                                          {item.title}
                                        </span>
                                        {!item.isRead ? (
                                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#0D56A6]" />
                                        ) : null}
                                      </span>
                                      <span className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">
                                        {getNotificationPreview(item.message)}
                                      </span>
                                      <span className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                        <span>
                                          {t(NOTIFICATION_TYPE_LABEL_KEYS[item.type])}
                                        </span>
                                        {item.createdAt ? (
                                          <span>
                                            {formatNotificationDate(
                                              item.createdAt
                                            )}
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/khoa-hoc"
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#F5F9FF]"
                      aria-label={t("favorites.label")}
                    >
                      <Heart
                        className={cn(
                          "h-6 w-6 text-rose-600",
                          favoriteCourseCount > 0 && "fill-current"
                        )}
                        strokeWidth={2}
                      />
                      {favoriteCourseCount > 0 ? (
                        <span
                          key={favoriteCourseCount}
                          className="notification-count-badge absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-rose-600 bg-white px-1 text-[11px] font-black leading-none text-rose-600 shadow-[0_4px_10px_rgba(15,23,42,0.18)]"
                        >
                          {favoriteCourseCount > 99
                            ? "99+"
                            : favoriteCourseCount}
                        </span>
                      ) : null}
                    </Link>

                    <div ref={profileMenuRef} className="relative">
                      <button
                        type="button"
                        title={user?.name || user?.email || t("profile.account")}
                        onClick={() => setOpenProfileMenu((prev) => !prev)}
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[#0B2C5F] transition hover:bg-slate-200"
                        aria-label={t("profile.openMenu")}
                      >
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={user?.name || "Avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : user?.name || user?.email ? (
                          <span className="text-[14px] font-bold">
                            {userInitial}
                          </span>
                        ) : (
                          <User className="h-5 w-5" strokeWidth={2} />
                        )}
                      </button>

                      <div
                        className={cn(
                          "absolute right-0 top-[calc(100%+12px)] z-[90] w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-all duration-200",
                          openProfileMenu
                            ? "visible translate-y-0 opacity-100"
                            : "invisible -translate-y-1 opacity-0"
                        )}
                      >
                        <div className="border-b border-slate-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[#0B2C5F]">
                              {userAvatar ? (
                                <img
                                  src={userAvatar}
                                  alt={user?.name || "Avatar"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">
                                  {userInitial}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-1 text-[14px] font-semibold text-[#0B2C5F]">
                                {user?.name || t("profile.user")}
                              </p>
                              <p className="line-clamp-1 mt-1 text-[12px] text-slate-500">
                                {user?.email || ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          <Link
                            href="/tai-khoan"
                            onClick={() => setOpenProfileMenu(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                          >
                            <User className="h-4 w-4" />
                            <span>{t("profile.account")}</span>
                          </Link>

                          {canAccessStudent && (
                            <Link
                              href="/student/bang-tin"
                              onClick={() => setOpenProfileMenu(false)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                            >
                              <GraduationCap className="h-4 w-4" />
                              <span>{t("profile.studentPage")}</span>
                            </Link>
                          )}

                          {canAccessAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setOpenProfileMenu(false)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-[#0B2C5F] transition hover:bg-[#F5F9FF] hover:text-[#0D56A6]"
                            >
                              <BrickWallShield className="h-4 w-4" />
                              <span>{t("profile.adminPage")}</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>
                              {loggingOut
                                ? t("profile.loggingOut")
                                : t("profile.logout")}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <LanguageSwitcher className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#0D56A6] text-[#0D56A6] transition hover:bg-[#0D56A6] hover:text-white" />
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "pointer-events-auto absolute inset-x-0 top-0 z-30 bg-white",
              "transition-[transform,box-shadow] duration-300 will-change-transform",
              scrolled
                ? "translate-y-0 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                : "translate-y-[82px]"
            )}
          >
            <div className="mx-auto flex h-[78px] max-w-[1240px] items-center gap-4 px-4 md:px-6">
              <div className="flex shrink-0 items-center justify-start lg:w-[180px]">
                <Link href="/" className="-ml-2 shrink-0">
                  <Image
                    src="/Logo.png"
                    alt="IIG Việt Nam"
                    width={155}
                    height={64}
                    className={cn(
                      "block h-auto object-contain transition-[width] duration-300",
                      scrolled ? "w-[142px]" : "w-[155px]"
                    )}
                    priority
                  />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                <nav className="hidden items-center justify-center gap-6 lg:flex xl:gap-9">
                  {MENU.slice(0, 2).map((item) => (
                    <Link
                      key={item.labelKey}
                      href={item.href}
                      className="whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}

                  <Link
                    href="/khoa-hoc"
                    className="whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                  >
                    {t("nav.courses")}
                  </Link>

                  {MENU.slice(2).map((item) => (
                    <Link
                      key={item.labelKey}
                      href={item.href}
                      className="whitespace-nowrap text-[14px] font-semibold text-[#0B2C5F] transition hover:text-[#0D56A6]"
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex shrink-0 justify-end lg:w-[180px]">
                {!checkingAuth && isLoggedIn ? (
                  <Link
                    href="/khoa-hoc-cua-toi"
                    className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0D56A6] px-6 text-[14px] font-semibold text-white transition hover:bg-[#0B4A8E]"
                  >
                    {t("nav.myCourses")}
                  </Link>
                ) : (
                  <div className="h-11 w-[180px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {selectedNotification ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
            {(() => {
              const meta = NOTIFICATION_TYPE_META[selectedNotification.type];
              const Icon = meta.icon;

              return (
                <>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          meta.iconClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-[12px] font-bold ring-1",
                              meta.badgeClass
                            )}
                          >
                            {t(NOTIFICATION_TYPE_LABEL_KEYS[selectedNotification.type])}
                          </span>
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                            {t("notifications.read")}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black leading-7 text-[#0B2C5F]">
                          {selectedNotification.title}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedNotification(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label={t("notifications.close")}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
                    <p className="whitespace-pre-line text-[15px] leading-7 text-slate-700">
                      {selectedNotification.message}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-[12px] font-semibold text-slate-500">
                      {selectedNotification.createdAt ? (
                        <span>
                          {t("notifications.sentAt")}{" "}
                          {formatNotificationDate(
                            selectedNotification.createdAt
                          )}
                        </span>
                      ) : null}
                      {selectedNotification.readAt ? (
                        <span>
                          {t("notifications.readAt")}{" "}
                          {formatNotificationDate(selectedNotification.readAt)}
                        </span>
                      ) : null}
                      {readingNotificationId === selectedNotification._id ? (
                        <span className="inline-flex items-center gap-1.5 text-[#0D56A6]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("notifications.updating")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedNotification(null)}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4A8E]"
                    >
                      {t("notifications.close")}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </>
  );
}
