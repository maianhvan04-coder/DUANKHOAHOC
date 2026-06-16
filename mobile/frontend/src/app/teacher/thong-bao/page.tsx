"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  TriangleAlert,
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
import {
  hasTeacherPortalPermission,
  TEACHER_PORTAL_PERMISSIONS,
} from "@/lib/helpers/auth/access";
import { emitNotificationChanged } from "@/lib/utils/notification-events";

type ReadFilter = "" | "true" | "false";

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: LucideIcon; className: string }
> = {
  INFO: {
    label: "Thông tin",
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  SUCCESS: {
    label: "Thành công",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  WARNING: {
    label: "Cảnh báo",
    icon: TriangleAlert,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ERROR: {
    label: "Lỗi",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
      message?: unknown;
    };

    if (typeof maybe.response?.data?.message === "string") {
      return maybe.response.data.message;
    }

    if (typeof maybe.response?.data?.error === "string") {
      return maybe.response.data.error;
    }

    if (typeof maybe.message === "string") {
      return maybe.message;
    }
  }

  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TeacherNotificationsPage() {
  const { access } = useAuth();
  const canUpdateNotifications = hasTeacherPortalPermission(
    access,
    TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE
  );

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorText("");

      const result = await notificationApi.getMine({
        page,
        limit: 10,
        isRead: readFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setItems(Array.isArray(result.data.items) ? result.data.items : []);
      setTotal(result.data.pagination?.total || 0);
      setTotalPages(Math.max(result.data.pagination?.totalPages || 1, 1));
    } catch (error) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setErrorText(getErrorMessage(error, "Không tải được thông báo"));
    } finally {
      setLoading(false);
    }
  }, [page, readFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function markAsRead(item: NotificationItem) {
    if (!canUpdateNotifications || item.isRead) return;

    try {
      setActionLoading(item._id);
      const result = await notificationApi.markAsRead(item._id);
      const readAt = result.data.readAt || new Date().toISOString();

      setItems((prev) =>
        prev.map((current) =>
          current._id === item._id
            ? { ...current, isRead: true, readAt }
            : current
        )
      );
      emitNotificationChanged();
      toast.success(result.message || "Đã đánh dấu thông báo là đã đọc");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không cập nhật được thông báo"));
    } finally {
      setActionLoading(null);
    }
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <>
      <Toaster richColors position="top-right" />

      <main className="space-y-5 p-4 md:p-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
              {[
                { label: "Tất cả", value: "" as ReadFilter },
                { label: "Chưa đọc", value: "false" as ReadFilter },
                { label: "Đã đọc", value: "true" as ReadFilter },
              ].map((item) => (
                <button
                  key={item.value || "all"}
                  type="button"
                  onClick={() => {
                    setReadFilter(item.value);
                    setPage(1);
                  }}
                  className={cn(
                    "h-10 rounded-md px-4 text-sm font-bold transition",
                    readFilter === item.value
                      ? "bg-white text-[#0D56A6] shadow-sm dark:bg-slate-900 dark:text-sky-200"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0D8DCE] px-5 text-sm font-bold text-white transition hover:bg-[#087FBB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Làm mới
            </button>
          </div>
        </section>

        {errorText ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải thông báo...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/10">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Chưa có thông báo phù hợp.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {items.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;

                return (
                  <article key={item._id} className="px-5 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
                          meta.className
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                              meta.className
                            )}
                          >
                            {meta.label}
                          </span>
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

                        <h2 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                          {item.title}
                        </h2>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {item.message}
                        </p>
                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      {canUpdateNotifications ? (
                        <button
                          type="button"
                          onClick={() => void markAsRead(item)}
                          disabled={item.isRead || actionLoading === item._id}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {actionLoading === item._id
                            ? "Đang cập nhật"
                            : "Đã đọc"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <button
              type="button"
              onClick={() => hasPrev && setPage((prev) => prev - 1)}
              disabled={!hasPrev || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </button>

            <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Trang {page}/{totalPages} · Tổng {total}
            </p>

            <button
              type="button"
              onClick={() => hasNext && setPage((prev) => prev + 1)}
              disabled={!hasNext || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
