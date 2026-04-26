"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  notificationApi,
  type NotificationItem,
  type NotificationType,
} from "@/app/api/notification.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { emitNotificationChanged } from "@/lib/utils/notification-events";

type ReadFilter = "" | "true" | "false";

type NotificationQuery = {
  isRead: ReadFilter;
  type: "" | NotificationType;
};

type TypeMeta = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
};

const TYPE_OPTIONS: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR"];

const TYPE_META: Record<NotificationType, TypeMeta> = {
  INFO: {
    label: "Thông tin",
    icon: Info,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    iconClass: "bg-blue-50 text-blue-700",
  },
  SUCCESS: {
    label: "Thành công",
    icon: CheckCircle2,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  WARNING: {
    label: "Cảnh báo",
    icon: AlertTriangle,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    iconClass: "bg-amber-50 text-amber-700",
  },
  ERROR: {
    label: "Lỗi",
    icon: XCircle,
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    iconClass: "bg-rose-50 text-rose-700",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    const responseError = maybeError.response?.data?.error;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

function formatDate(value?: string | null) {
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

function NotificationTypeBadge({ type }: { type: NotificationType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        meta.badgeClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D56A6] text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user, hydrated, isLoading } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [readFilter, setReadFilter] = useState<ReadFilter>("");
  const [typeFilter, setTypeFilter] = useState<"" | NotificationType>("");
  const [query, setQuery] = useState<NotificationQuery>({
    isRead: "",
    type: "",
  });

  const readCountOnPage = useMemo(
    () => items.filter((item) => item.isRead).length,
    [items]
  );

  const loadNotifications = useCallback(
    async (nextPage: number, nextQuery: NotificationQuery) => {
      if (!user) return;

      try {
        setLoading(true);
        setError("");

        const result = await notificationApi.getMine({
          page: nextPage,
          limit: 10,
          isRead: nextQuery.isRead || undefined,
          type: nextQuery.type || undefined,
        });

        const data = result.data;
        const pagination = data.pagination ?? {
          page: nextPage,
          limit: 10,
          total: 0,
          totalPages: 1,
        };

        setItems(Array.isArray(data.items) ? data.items : []);
        setUnreadCount(data.unreadCount || 0);
        setPage(pagination.page || nextPage);
        setTotal(pagination.total || 0);
        setTotalPages(Math.max(pagination.totalPages || 1, 1));
      } catch (error: unknown) {
        setItems([]);
        setUnreadCount(0);
        setPage(1);
        setTotal(0);
        setTotalPages(1);
        setError(getErrorMessage(error, "Không tải được thông báo"));
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!hydrated || isLoading || !user) return;
    void loadNotifications(1, query);
  }, [hydrated, isLoading, loadNotifications, query, user]);

  function applyFilters() {
    setQuery({
      isRead: readFilter,
      type: typeFilter,
    });
  }

  function resetFilters() {
    setReadFilter("");
    setTypeFilter("");
    setQuery({
      isRead: "",
      type: "",
    });
  }

  async function markAsRead(item: NotificationItem) {
    if (item.isRead) return;

    try {
      setActionLoading(item._id);
      const result = await notificationApi.markAsRead(item._id);
      const nextReadAt = result.data.readAt || new Date().toISOString();

      setItems((prev) =>
        prev.map((current) =>
          current._id === item._id
            ? {
                ...current,
                isRead: true,
                readAt: nextReadAt,
              }
            : current
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      emitNotificationChanged();
      toast.success(result.message || "Đã đánh dấu đã đọc");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không cập nhật được thông báo"));
    } finally {
      setActionLoading(null);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return;

    try {
      setActionLoading("all");
      const result = await notificationApi.markAllAsRead();
      const now = new Date().toISOString();

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || now,
        }))
      );
      setUnreadCount(0);
      emitNotificationChanged();
      toast.success(result.message || "Đã đọc tất cả thông báo");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không cập nhật được thông báo"));
    } finally {
      setActionLoading(null);
    }
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải thông báo...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-[#0D56A6]">
            <Bell className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">
            Vui lòng đăng nhập để xem thông báo
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Thông báo cá nhân chỉ hiển thị cho tài khoản đã đăng nhập.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#0D56A6] px-6 text-sm font-bold text-white transition hover:bg-[#0B4A8E]"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#0D56A6]">
                  <Bell className="h-4 w-4" />
                  Trung tâm thông báo
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Thông báo của bạn
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Theo dõi các thông báo từ quản trị viên, giáo viên và quản lý
                  về lịch học, tài khoản hoặc những cập nhật quan trọng.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  disabled={unreadCount === 0 || actionLoading === "all"}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4A8E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {actionLoading === "all" ? "Đang cập nhật..." : "Đọc tất cả"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadNotifications(page, query)}
                  disabled={loading}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Làm mới
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Tổng thông báo"
              value={total}
              icon={<Bell className="h-5 w-5" />}
            />
            <StatCard
              label="Chưa đọc"
              value={unreadCount}
              icon={<Clock3 className="h-5 w-5" />}
            />
            <StatCard
              label="Đã đọc trên trang"
              value={readCountOnPage}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
          </section>

          <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                {[
                  { label: "Tất cả", value: "" as ReadFilter },
                  { label: "Chưa đọc", value: "false" as ReadFilter },
                  { label: "Đã đọc", value: "true" as ReadFilter },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setReadFilter(item.value);
                      setQuery((prev) => ({ ...prev, isRead: item.value }));
                    }}
                    className={cn(
                      "h-10 rounded-xl px-4 text-sm font-bold transition",
                      query.isRead === item.value
                        ? "bg-white text-[#0D56A6] shadow-sm"
                        : "text-slate-600 hover:bg-white/70"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as "" | NotificationType)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">Tất cả loại</option>
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_META[type].label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Lọc
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200 p-5"
                  >
                    <div className="animate-pulse">
                      <div className="h-5 w-48 rounded-xl bg-slate-100" />
                      <div className="mt-4 h-4 w-3/4 rounded-xl bg-slate-100" />
                      <div className="mt-3 h-4 w-1/2 rounded-xl bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                  <Bell className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-900">
                  Chưa có thông báo
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Khi quản trị viên, giáo viên hoặc quản lý gửi thông báo, nội
                  dung sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const meta = TYPE_META[item.type];
                  const Icon = meta.icon;

                  return (
                    <article
                      key={item._id}
                      className={cn(
                        "rounded-3xl border p-5 transition hover:border-slate-300 hover:shadow-sm",
                        item.isRead
                          ? "border-slate-200 bg-white"
                          : "border-blue-200 bg-blue-50/40"
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                            meta.iconClass
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <NotificationTypeBadge type={item.type} />
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                item.isRead
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              )}
                            >
                              {item.isRead ? "Đã đọc" : "Chưa đọc"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-black leading-tight text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                            {item.message}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                            <span>{formatDate(item.createdAt)}</span>
                            {item.readAt ? <span>Đọc lúc {formatDate(item.readAt)}</span> : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => void markAsRead(item)}
                            disabled={item.isRead || actionLoading === item._id}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {actionLoading === item._id ? "Đang cập nhật..." : "Đã đọc"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => hasPrev && loadNotifications(page - 1, query)}
                disabled={!hasPrev || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Trang trước
              </button>

              <div className="text-center text-sm font-semibold text-slate-500">
                Trang <span className="text-slate-950">{page}</span> /{" "}
                <span className="text-slate-950">{totalPages}</span> · Tổng{" "}
                <span className="text-slate-950">{total}</span>
              </div>

              <button
                type="button"
                onClick={() => hasNext && loadNotifications(page + 1, query)}
                disabled={!hasNext || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
