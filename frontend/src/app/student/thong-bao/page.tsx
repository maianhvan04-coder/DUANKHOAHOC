"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
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
  useStudentPreferences,
  type StudentLocale,
  type StudentMessageKey,
} from "@/i18n";
import { emitNotificationChanged } from "@/lib/utils/notification-events";

type ReadFilter = "" | "true" | "false";

type NotificationQuery = {
  isRead: ReadFilter;
  type: "" | NotificationType;
};

type TypeStyle = {
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
};

const TYPE_OPTIONS: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR"];

const TYPE_STYLES: Record<NotificationType, TypeStyle> = {
  INFO: {
    icon: Info,
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200",
    iconClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  },
  SUCCESS: {
    icon: CheckCircle2,
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
    iconClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  WARNING: {
    icon: AlertTriangle,
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
    iconClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  },
  ERROR: {
    icon: XCircle,
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200",
    iconClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  },
};

const TYPE_LABEL_KEYS: Record<NotificationType, StudentMessageKey> = {
  INFO: "notifications.type.info",
  SUCCESS: "notifications.type.success",
  WARNING: "notifications.type.warning",
  ERROR: "notifications.type.error",
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

function formatDate(value: string | null | undefined, locale: StudentLocale) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function NotificationTypeBadge({
  label,
  type,
}: {
  label: string;
  type: NotificationType;
}) {
  const style = TYPE_STYLES[type];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        style.badgeClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export default function StudentNotificationsPage() {
  const { user, hydrated, isLoading } = useAuth();
  const { locale, t } = useStudentPreferences();

  const [items, setItems] = useState<NotificationItem[]>([]);
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
        setPage(pagination.page || nextPage);
        setTotal(pagination.total || 0);
        setTotalPages(Math.max(pagination.totalPages || 1, 1));
      } catch (loadError: unknown) {
        setItems([]);
        setPage(1);
        setTotal(0);
        setTotalPages(1);
        setError(getErrorMessage(loadError, t("notifications.loadError")));
      } finally {
        setLoading(false);
      }
    },
    [t, user]
  );

  useEffect(() => {
    if (!hydrated || isLoading || !user) return;
    void loadNotifications(page, query);
  }, [hydrated, isLoading, loadNotifications, page, query, user]);

  function applyFilters() {
    setPage(1);
    setQuery({
      isRead: readFilter,
      type: typeFilter,
    });
  }

  async function refreshNotifications() {
    await loadNotifications(page, query);
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
      emitNotificationChanged();
      toast.success(result.message || t("notifications.markReadSuccess"));
    } catch (markError: unknown) {
      toast.error(getErrorMessage(markError, t("notifications.updateError")));
    } finally {
      setActionLoading(null);
    }
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (!hydrated || isLoading) {
    return (
      <main className="flex min-h-[520px] items-center justify-center p-4 md:p-6">
        <div className="inline-flex items-center gap-2 border border-[#cbe7fb] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("notifications.loading")}
        </div>
      </main>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <main className="space-y-6 p-4 md:p-6">
        <section className="border border-[#cbe7fb] bg-white p-4 shadow-sm md:p-5 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-full rounded-xl border border-[#cbe7fb] bg-[#F4FAFF] p-1.5 sm:w-auto dark:border-white/10 dark:bg-white/5">
              {[
                { label: t("notifications.all"), value: "" as ReadFilter },
                {
                  label: t("notifications.unread"),
                  value: "false" as ReadFilter,
                },
                { label: t("notifications.read"), value: "true" as ReadFilter },
              ].map((item) => (
                <button
                  key={item.value || "all"}
                  type="button"
                  onClick={() => {
                    setReadFilter(item.value);
                    setPage(1);
                    setQuery((prev) => ({ ...prev, isRead: item.value }));
                  }}
                  className={cn(
                    "h-10 flex-1 rounded-lg px-4 text-sm font-bold transition sm:flex-none",
                    query.isRead === item.value
                      ? "bg-white text-[#1677ff] shadow-sm dark:bg-slate-900"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
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
                className="h-11 rounded-xl border border-[#cbe7fb] bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1677ff] focus:ring-4 focus:ring-[#1677ff]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">{t("notifications.allTypes")}</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {t(TYPE_LABEL_KEYS[type])}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={applyFilters}
                className="h-11 rounded-xl bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4B92] dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                {t("notifications.filter")}
              </button>

              <button
                type="button"
                onClick={() => void refreshNotifications()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cbe7fb] bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                {t("notifications.refresh")}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="border border-[#cbe7fb] bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#cbe7fb] p-5 dark:border-white/10"
                >
                  <div className="animate-pulse">
                    <div className="h-5 w-48 rounded-xl bg-slate-100 dark:bg-white/10" />
                    <div className="mt-4 h-4 w-3/4 rounded-xl bg-slate-100 dark:bg-white/10" />
                    <div className="mt-3 h-4 w-1/2 rounded-xl bg-slate-100 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbe7fb] bg-[#F8FCFF] px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-900">
                <Bell className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-900 dark:text-slate-100">
                {t("notifications.noNotificationsTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("notifications.noNotificationsDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const style = TYPE_STYLES[item.type];
                const Icon = style.icon;

                return (
                  <article
                    key={item._id}
                    className={cn(
                      "rounded-2xl border p-5 transition hover:border-[#0D56A6] hover:shadow-sm dark:hover:border-white/20",
                      item.isRead
                        ? "border-[#cbe7fb] bg-white dark:border-white/10 dark:bg-slate-950/30"
                        : "border-[#0D56A6] bg-[#F4FAFF] dark:border-sky-500/30 dark:bg-sky-500/10"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                          style.iconClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <NotificationTypeBadge
                            label={t(TYPE_LABEL_KEYS[item.type])}
                            type={item.type}
                          />
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                              item.isRead
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200"
                            )}
                          >
                            {item.isRead
                              ? t("notifications.read")
                              : t("notifications.unread")}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black leading-tight text-slate-950 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {item.message}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>{formatDate(item.createdAt, locale)}</span>
                          {item.readAt ? (
                            <span>
                              {t("notifications.readAt")}{" "}
                              {formatDate(item.readAt, locale)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => void markAsRead(item)}
                          disabled={item.isRead || actionLoading === item._id}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cbe7fb] bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {actionLoading === item._id
                            ? t("notifications.updating")
                            : t("notifications.markRead")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <button
              type="button"
              onClick={() => hasPrev && setPage(page - 1)}
              disabled={!hasPrev || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cbe7fb] bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("notifications.previousPage")}
            </button>

            <div className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("notifications.page")}{" "}
              <span className="text-slate-950 dark:text-slate-100">{page}</span>{" "}
              /{" "}
              <span className="text-slate-950 dark:text-slate-100">
                {totalPages}
              </span>{" "}
              · {t("notifications.total")}{" "}
              <span className="text-slate-950 dark:text-slate-100">{total}</span>
            </div>

            <button
              type="button"
              onClick={() => hasNext && setPage(page + 1)}
              disabled={!hasNext || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cbe7fb] bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {t("notifications.nextPage")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
