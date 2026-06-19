"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Info,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  UserPlus,
  UserRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  notificationApi,
  type NotificationItem,
  type NotificationType,
} from "@/app/api/notification.api";
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

type CoursePurchaseMetadata = {
  kind?: string;
  source?: string;
  buyer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  courses?: Array<{
    courseId?: string;
    title?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
  amount?: number;
  provider?: string | null;
  paymentCode?: number | null;
  transactionCode?: string | null;
  gatewayTransactionNo?: string | null;
  mode?: string | null;
  classRoomId?: string | null;
  studyId?: string | null;
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

function getSafeActionUrl(item: NotificationItem) {
  const url = item.actionUrl?.trim();
  if (!url || !url.startsWith("/admin/")) return "";
  return url;
}

function formatMoney(value: unknown) {
  return `${new Intl.NumberFormat("vi-VN").format(asNumber(value))} đ`;
}

function getCoursePurchaseMetadata(
  item: NotificationItem
): CoursePurchaseMetadata | null {
  const metadata = item.metadata;
  if (!isRecord(metadata) || metadata.kind !== "COURSE_PURCHASE") return null;

  const buyer = isRecord(metadata.buyer) ? metadata.buyer : {};
  const courses = Array.isArray(metadata.courses)
    ? metadata.courses
        .filter(isRecord)
        .map((course) => ({
          courseId: asString(course.courseId),
          title: asString(course.title),
          quantity: asNumber(course.quantity, 1),
          unitPrice: asNumber(course.unitPrice),
          subtotal: asNumber(course.subtotal),
        }))
    : [];

  return {
    kind: "COURSE_PURCHASE",
    source: asString(metadata.source),
    buyer: {
      id: asString(buyer.id),
      name: asString(buyer.name),
      email: asString(buyer.email),
    },
    courses,
    amount: asNumber(metadata.amount),
    provider:
      typeof metadata.provider === "string" ? metadata.provider : null,
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
    mode: typeof metadata.mode === "string" ? metadata.mode : null,
    classRoomId:
      typeof metadata.classRoomId === "string" ? metadata.classRoomId : null,
    studyId: typeof metadata.studyId === "string" ? metadata.studyId : null,
  };
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100">
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

export default function AdminMyNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

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
    []
  );

  useEffect(() => {
    void loadNotifications(page, query);
  }, [loadNotifications, page, query]);

  function applyFilters() {
    setPage(1);
    setQuery({
      isRead: readFilter,
      type: typeFilter,
    });
  }

  function resetFilters() {
    setReadFilter("");
    setTypeFilter("");
    setPage(1);
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

  async function openDetail(item: NotificationItem) {
    setSelectedNotification(item);
    if (!item.isRead) {
      await markAsRead(item);
    }
  }

  function goToNotificationAction(item: NotificationItem) {
    const url = getSafeActionUrl(item);
    if (!url) return;

    setSelectedNotification(null);
    router.push(url);
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

  return (
    <>

      <main className="space-y-6">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-[#0D56A6]">
                <Bell className="h-4 w-4" />
                Hộp thư thông báo
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                Đây là nơi bạn nhận thông báo gửi đến tài khoản hiện tại. Chuông
                trên thanh trên cùng cũng dẫn tới trang này thay vì trang tạo thông báo.
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
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Làm mới
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5">
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
                      ? "bg-white text-[#0D56A6] shadow-sm dark:bg-slate-900"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300"
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
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-white/10"
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
                className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                Lọc
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 p-5 dark:border-white/10"
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
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm dark:bg-slate-900">
                <Bell className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-900 dark:text-slate-100">
                Chưa có thông báo
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Khi có thông báo mới gửi đến tài khoản của bạn, nội dung sẽ xuất
                hiện tại đây.
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
                      "rounded-3xl border p-5 transition hover:border-slate-300 hover:shadow-sm dark:hover:border-white/20",
                      item.isRead
                        ? "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/30"
                        : "border-blue-200 bg-blue-50/40 dark:border-sky-500/30 dark:bg-sky-500/10"
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

                        <h3 className="mt-3 text-xl font-black leading-tight text-slate-950 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {item.message}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>{formatDate(item.createdAt)}</span>
                          {item.readAt ? (
                            <span>Đọc lúc {formatDate(item.readAt)}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openDetail(item)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0D56A6] px-4 text-sm font-bold text-white transition hover:bg-[#0B4A8E]"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => void markAsRead(item)}
                          disabled={item.isRead || actionLoading === item._id}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {actionLoading === item._id
                            ? "Đang cập nhật..."
                            : "Đã đọc"}
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </button>

            <div className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Trang <span className="text-slate-950 dark:text-slate-100">{page}</span>{" "}
              / <span className="text-slate-950 dark:text-slate-100">{totalPages}</span>{" "}
              · Tổng <span className="text-slate-950 dark:text-slate-100">{total}</span>
            </div>

            <button
              type="button"
              onClick={() => hasNext && setPage(page + 1)}
              disabled={!hasNext || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {selectedNotification
        ? (() => {
            const purchase = getCoursePurchaseMetadata(selectedNotification);
            const actionUrl = getSafeActionUrl(selectedNotification);

            return (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
                <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
                  <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <NotificationTypeBadge type={selectedNotification.type} />
                        {purchase ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            <ReceiptText className="h-3.5 w-3.5" />
                            Mua khóa học
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 dark:text-white">
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
                            <div className="mt-2 truncate text-sm font-black text-slate-950 dark:text-white">
                              {purchase.buyer?.name || "Học viên"}
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              {purchase.buyer?.email || "-"}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              <CreditCard className="h-4 w-4" />
                              Thanh toán
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                              {formatMoney(purchase.amount)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              <ReceiptText className="h-4 w-4" />
                              Mã giao dịch
                            </div>
                            <div className="mt-2 break-all font-mono text-sm font-black text-slate-950 dark:text-white">
                              {purchase.transactionCode ||
                                purchase.gatewayTransactionNo ||
                                purchase.paymentCode ||
                                "-"}
                            </div>
                          </div>
                        </div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                            Khóa học đã mua
                          </div>
                          <div className="divide-y divide-slate-200 dark:divide-white/10">
                            {(purchase.courses || []).length ? (
                              purchase.courses?.map((course, index) => (
                                <div
                                  key={`${course.courseId || index}`}
                                  className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_120px_140px]"
                                >
                                  <div className="min-w-0">
                                    <div className="truncate font-bold text-slate-950 dark:text-white">
                                      {course.title || "Khóa học"}
                                    </div>
                                    <div className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                      {course.courseId || "-"}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                                    SL: {course.quantity || 1}
                                  </div>
                                  <div className="font-bold text-slate-950 dark:text-white md:text-right">
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
