"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Eye,
  Globe,
  Loader2,
  Menu,
  Moon,
  ReceiptText,
  Sun,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import {
  notificationApi,
  type NotificationItem,
} from "@/app/api/notification.api";
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

type PurchaseNotificationMeta = {
  buyer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  courses?: Array<{
    courseId?: string;
    title?: string;
    quantity?: number;
    subtotal?: number;
  }>;
  amount?: number;
  paymentCode?: number | null;
  transactionCode?: string | null;
  gatewayTransactionNo?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatNotificationDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(value: unknown) {
  return `${new Intl.NumberFormat("vi-VN").format(asNumber(value))} đ`;
}

function getNotificationPreview(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= 110) return normalized;
  return `${normalized.slice(0, 110)}...`;
}

function getSafeActionUrl(item: NotificationItem) {
  const url = item.actionUrl?.trim();
  if (!url || !url.startsWith("/admin/")) return "";
  return url;
}

function getPurchaseMeta(item: NotificationItem): PurchaseNotificationMeta | null {
  const metadata = item.metadata;
  if (!isRecord(metadata) || metadata.kind !== "COURSE_PURCHASE") return null;

  const buyer = isRecord(metadata.buyer) ? metadata.buyer : {};
  const courses = Array.isArray(metadata.courses)
    ? metadata.courses.filter(isRecord).map((course) => ({
        courseId: asString(course.courseId),
        title: asString(course.title),
        quantity: asNumber(course.quantity, 1),
        subtotal: asNumber(course.subtotal),
      }))
    : [];

  return {
    buyer: {
      id: asString(buyer.id),
      name: asString(buyer.name),
      email: asString(buyer.email),
    },
    courses,
    amount: asNumber(metadata.amount),
    paymentCode:
      metadata.paymentCode === null || metadata.paymentCode === undefined
        ? null
        : asNumber(metadata.paymentCode),
    transactionCode:
      typeof metadata.transactionCode === "string"
        ? metadata.transactionCode
        : null,
    gatewayTransactionNo:
      typeof metadata.gatewayTransactionNo === "string"
        ? metadata.gatewayTransactionNo
        : null,
  };
}

const ADMIN_PAGE_TITLES = [
  { path: "/admin/dashboard", titleKey: "page.dashboard" },
  { path: "/admin/users", titleKey: "page.users" },
  { path: "/admin/students", titleKey: "page.students" },
  { path: "/admin/teachers", titleKey: "page.teachers" },
  { path: "/admin/course/categories", titleKey: "page.courseCategories" },
  { path: "/admin/course", titleKey: "page.course" },
  { path: "/admin/classes", titleKey: "page.classes" },
  { path: "/admin/schedule", titleKey: "page.schedule" },
  { path: "/admin/blog/categories", titleKey: "page.blogCategories" },
  { path: "/admin/blog", titleKey: "page.blog" },
  { path: "/admin/notification", titleKey: "page.notification" },
  { path: "/admin/my-notifications", titleKey: "page.myNotifications" },
  { path: "/admin/rbac", titleKey: "page.rbac" },
  { path: "/admin/payment-methods", titleKey: "page.paymentMethods" },
  { path: "/admin/payment-audits", titleKey: "page.paymentAudits" },
  { path: "/admin/balance-history", titleKey: "page.balanceHistory" },
  { path: "/admin/bank-history", titleKey: "page.bankHistory" },
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
  const router = useRouter();
  const { collapsed, toggleCollapsed } = useAdminLayout();
  const { theme, toggleTheme } = useAdminTheme();
  const { t } = useAdminPreferences();
  const pathname = usePathname();
  const dark = theme === "dark";
  const title = t(getAdminPageTitle(pathname));
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [readingNotificationId, setReadingNotificationId] =
    useState<string | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

  const loadNotificationSummary = useCallback(async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");
      const result = await notificationApi.getMine({
        page: 1,
        limit: 5,
      });

      setNotificationItems(Array.isArray(result.data.items) ? result.data.items : []);
      setUnreadCount(result.data.unreadCount || 0);
    } catch {
      setNotificationItems([]);
      setUnreadCount(0);
      setNotificationError("Không tải được thông báo");
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotificationSummary();
    }, 0);

    const handleChanged = () => {
      void loadNotificationSummary();
    };

    window.addEventListener(NOTIFICATION_CHANGED_EVENT, handleChanged);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(NOTIFICATION_CHANGED_EVENT, handleChanged);
    };
  }, [loadNotificationSummary]);

  useEffect(() => {
    if (!openNotificationMenu) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!notificationMenuRef.current) return;
      if (!notificationMenuRef.current.contains(event.target as Node)) {
        setOpenNotificationMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenNotificationMenu(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openNotificationMenu]);

  function toggleNotificationMenu() {
    const nextOpen = !openNotificationMenu;
    setOpenNotificationMenu(nextOpen);

    if (nextOpen) {
      void loadNotificationSummary();
    }
  }

  async function openNotificationDetail(item: NotificationItem) {
    setSelectedNotification(item);
    setOpenNotificationMenu(false);

    if (item.isRead) return;

    try {
      setReadingNotificationId(item._id);
      const result = await notificationApi.markAsRead(item._id);
      const readAt = result.data.readAt || new Date().toISOString();
      const nextItem = { ...item, isRead: true, readAt };

      setSelectedNotification(nextItem);
      setNotificationItems((prev) =>
        prev.map((current) => (current._id === item._id ? nextItem : current))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      window.dispatchEvent(new Event(NOTIFICATION_CHANGED_EVENT));
    } catch {
      setNotificationError("Không cập nhật được trạng thái đã đọc");
    } finally {
      setReadingNotificationId(null);
    }
  }

  function goToNotificationAction(item: NotificationItem) {
    const actionUrl = getSafeActionUrl(item);
    if (!actionUrl) return;

    setSelectedNotification(null);
    router.push(actionUrl);
  }

  return (
    <>
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

            <div ref={notificationMenuRef} className="relative">
              <button
                type="button"
                onClick={toggleNotificationMenu}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full border transition",
                  dark
                    ? "border-white/10 bg-white/5 text-white"
                    : "border-black/8 bg-white text-slate-700"
                )}
                aria-label={t("common.notificationsMine")}
                aria-expanded={openNotificationMenu}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1677ff] px-1 text-[10px] font-black text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {openNotificationMenu ? (
                <div
                  className={cn(
                    "absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-2xl border shadow-[0_22px_60px_rgba(15,23,42,0.22)]",
                    dark
                      ? "border-white/10 bg-[#111827]"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        Thông báo
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {unreadCount} chưa đọc
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenNotificationMenu(false);
                        router.push("/admin/my-notifications");
                      }}
                      className="text-xs font-bold text-[#0D56A6] hover:underline dark:text-sky-300"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {notificationLoading ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải thông báo...
                      </div>
                    ) : notificationError ? (
                      <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                        {notificationError}
                      </div>
                    ) : notificationItems.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell className="mx-auto h-7 w-7 text-slate-400" />
                        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          Chưa có thông báo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notificationItems.map((item) => {
                          const purchase = getPurchaseMeta(item);

                          return (
                            <article
                              key={item._id}
                              className={cn(
                                "rounded-xl border p-3",
                                item.isRead
                                  ? "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                                  : "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                    purchase
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                                      : "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                                  )}
                                >
                                  {purchase ? (
                                    <ReceiptText className="h-4 w-4" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {purchase ? (
                                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                        Mua khóa học
                                      </span>
                                    ) : null}
                                    {!item.isRead ? (
                                      <span className="h-2 w-2 rounded-full bg-[#1677ff]" />
                                    ) : null}
                                  </div>
                                  <h3 className="mt-1 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
                                    {item.title}
                                  </h3>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {getNotificationPreview(item.message)}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-slate-400">
                                      {formatNotificationDate(item.createdAt)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => void openNotificationDetail(item)}
                                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0D56A6] px-3 text-xs font-bold text-white transition hover:bg-[#0B4A8E]"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Chi tiết
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <AdminLanguageSwitcher dark={dark} />
          </div>

          <AvatarMenu />
        </div>
      </div>
    </header>

    {selectedNotification
      ? (() => {
          const purchase = getPurchaseMeta(selectedNotification);
          const actionUrl = getSafeActionUrl(selectedNotification);

          return (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
              <section
                className={cn(
                  "flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl",
                  dark
                    ? "border-white/10 bg-slate-950 text-slate-100"
                    : "border-slate-200 bg-white text-slate-900"
                )}
              >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {purchase ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <ReceiptText className="h-3.5 w-3.5" />
                          Mua khóa học
                        </span>
                      ) : null}
                      {selectedNotification.isRead ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã đọc
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-2xl font-black leading-tight">
                      {selectedNotification.title}
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {selectedNotification.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNotification(null)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  {purchase ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <UserRound className="h-4 w-4" />
                            Học viên
                          </div>
                          <div className="mt-2 truncate text-sm font-black">
                            {purchase.buyer?.name || "Học viên"}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {purchase.buyer?.email || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <ReceiptText className="h-4 w-4" />
                            Số tiền
                          </div>
                          <div className="mt-2 text-sm font-black">
                            {formatMoney(purchase.amount)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <ReceiptText className="h-4 w-4" />
                            Mã giao dịch
                          </div>
                          <div className="mt-2 break-all font-mono text-sm font-black">
                            {purchase.transactionCode ||
                              purchase.gatewayTransactionNo ||
                              purchase.paymentCode ||
                              "-"}
                          </div>
                        </div>
                      </div>

                      <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black dark:border-white/10 dark:bg-white/[0.04]">
                          Khóa học đã mua
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-white/10">
                          {(purchase.courses || []).length ? (
                            purchase.courses?.map((course, index) => (
                              <div
                                key={`${course.courseId || index}`}
                                className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_100px_140px]"
                              >
                                <div className="min-w-0">
                                  <div className="truncate font-bold">
                                    {course.title || "Khóa học"}
                                  </div>
                                  <div className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                    {course.courseId || "-"}
                                  </div>
                                </div>
                                <div className="font-semibold text-slate-700 dark:text-slate-200">
                                  SL: {course.quantity || 1}
                                </div>
                                <div className="font-bold md:text-right">
                                  {formatMoney(course.subtotal)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-sm text-slate-500">
                              Không có dữ liệu khóa học
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      {selectedNotification.message}
                    </div>
                  )}

                  {readingNotificationId === selectedNotification._id ? (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang cập nhật trạng thái đã đọc...
                    </div>
                  ) : null}
                </div>

                <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedNotification(null)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Đóng
                  </button>
                  {actionUrl ? (
                    <button
                      type="button"
                      onClick={() => goToNotificationAction(selectedNotification)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4A8E]"
                    >
                      <UserPlus className="h-4 w-4" />
                      {selectedNotification.actionLabel || "Gán lớp học"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}
                </footer>
              </section>
            </div>
          );
        })()
      : null}
    </>
  );
}
