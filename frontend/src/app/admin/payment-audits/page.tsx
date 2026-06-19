"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  Hash,
  ReceiptText,
  UserRound,
  X,
} from "lucide-react";
import {
  paymentAuditApi,
  type PaymentAuditItem,
  type PaymentHistoryProvider,
  type PaymentHistorySortKey,
  type PaymentHistoryStatus,
} from "@/app/api/payment-audit.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  useAdminPreferences,
  type AdminMessageKey,
} from "@/i18n";
import type { SortDirection } from "@/lib/utils/admin-list";

type TimeRange = "" | "today" | "7d" | "30d";

const STATUS_LABEL_KEYS: Record<PaymentHistoryStatus, AdminMessageKey> = {
  PAID: "paymentHistory.status.paid",
  PENDING: "paymentHistory.status.pending",
  FAILED: "paymentHistory.status.failed",
  CANCELLED: "paymentHistory.status.cancelled",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
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

function getLocaleCode(locale: "vi" | "en") {
  return locale === "en" ? "en-US" : "vi-VN";
}

function getTransactionCode(item: PaymentAuditItem) {
  return (
    item.transactionCode?.trim() ||
    item.gatewayTransactionNo?.trim() ||
    item._id ||
    "-"
  );
}

function formatDate(value: string | null | undefined, locale: "vi" | "en") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(getLocaleCode(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number, locale: "vi" | "en") {
  return new Intl.NumberFormat(getLocaleCode(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function isDebitTransaction(item: PaymentAuditItem) {
  return item.type === "ADMIN_DEBIT";
}

function formatSignedMoney(item: PaymentAuditItem, locale: "vi" | "en") {
  const value = formatMoney(item.amount, locale);
  return isDebitTransaction(item) ? `-${value}` : value;
}

function getTransactionTypeLabelLegacy(
  type: PaymentAuditItem["type"],
  locale: "vi" | "en"
) {
  if (false) {
    return locale === "en" ? "Course purchase" : "Mua khóa học";
  }

  if (type === "ADMIN_DEBIT") {
    return locale === "en" ? "Balance deduction" : "Trừ số dư";
  }

  if (type === "REFUND") {
    return locale === "en" ? "Refund" : "Hoàn tiền";
  }

  if (type === "ENROLL") {
    return locale === "en" ? "Course enrollment" : "Đăng ký khóa học";
  }

  return locale === "en" ? "Balance top-up" : "Cộng số dư";
}

function getTransactionTypeLabel(
  type: PaymentAuditItem["type"],
  locale: "vi" | "en"
) {
  if (type === "ENROLL") {
    return locale === "en" ? "Course purchase" : "Mua khóa học";
  }

  if (type === "REFUND") {
    return locale === "en" ? "Refund" : "Hoàn tiền";
  }

  if (type === "ADMIN_DEBIT") {
    return locale === "en" ? "Balance deduction" : "Trừ số dư";
  }

  if (type === "TOPUP") {
    return locale === "en" ? "Balance top-up" : "Cộng số dư";
  }

  return "-";
}

function getUserName(item: PaymentAuditItem) {
  return (
    item.user?.name?.trim() ||
    item.user?.email?.trim() ||
    "-"
  );
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "-").trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getStatusTone(status: PaymentHistoryStatus) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "FAILED":
      return "danger" as const;
    case "CANCELLED":
      return "neutral" as const;
    case "PENDING":
    default:
      return "warning" as const;
  }
}

function getProviderLabel(
  provider: PaymentHistoryProvider | null | undefined,
  locale: "vi" | "en"
) {
  const normalized = provider?.trim().toLowerCase();
  if (normalized === "balance") {
    return locale === "en" ? "Balance" : "Số dư";
  }

  switch (provider) {
    case "vnpay":
      return "VNPAY";
    case "payos":
      return "PayOS";
    default:
      return provider?.trim() || "-";
  }
}

function getFromDate(range: TimeRange) {
  if (!range) return undefined;

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (range === "7d") {
    date.setDate(date.getDate() - 6);
  } else if (range === "30d") {
    date.setDate(date.getDate() - 29);
  }

  return date.toISOString();
}

function formatGatewayPayload(value: unknown, emptyText: string) {
  if (value === null || value === undefined || value === "") return emptyText;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: PaymentHistoryStatus;
}) {
  return (
    <AdminStatusBadge tone={getStatusTone(status)}>
      {label}
    </AdminStatusBadge>
  );
}

function ProviderBadge({
  locale,
  provider,
}: {
  locale: "vi" | "en";
  provider?: PaymentHistoryProvider | null;
}) {
  return (
    <span className="inline-flex h-7 items-center rounded-xl bg-sky-50 px-3 text-xs font-semibold tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
      {getProviderLabel(provider, locale)}
    </span>
  );
}

export default function AdminPaymentAuditsPage() {
  const { locale, t } = useAdminPreferences();
  const [items, setItems] = useState<PaymentAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"" | PaymentHistoryStatus>("");
  const [timeRange, setTimeRange] = useState<TimeRange>("");
  const [sortKey, setSortKey] =
    useState<PaymentHistorySortKey>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailItem, setDetailItem] = useState<PaymentAuditItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const activeFilterCount = [status, timeRange].filter(Boolean).length;
  const fromDate = useMemo(() => getFromDate(timeRange), [timeRange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    const requestId = ++listRequestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const result = await paymentAuditApi.getAdminList({
        page,
        limit: pageSize,
        keyword: debouncedSearch || undefined,
        status: status || undefined,
        fromDate,
        sortBy: sortKey,
        sortOrder: sortDirection,
      });

      if (requestId !== listRequestIdRef.current) return;

      setItems(result.items);
      setPage(result.pagination.page);
      setPageSize(result.pagination.limit);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages || 1, 1));
    } catch (loadError: unknown) {
      if (requestId !== listRequestIdRef.current) return;

      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(getErrorMessage(loadError, t("paymentHistory.loadFail")));
    } finally {
      if (requestId === listRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    debouncedSearch,
    fromDate,
    page,
    pageSize,
    sortDirection,
    sortKey,
    status,
    t,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const closeDetail = useCallback(() => {
    detailRequestIdRef.current += 1;
    setDetailItem(null);
    setDetailError("");
    setDetailLoading(false);
  }, []);

  const openDetail = useCallback(
    async (item: PaymentAuditItem) => {
      const requestId = ++detailRequestIdRef.current;
      setDetailItem(item);
      setDetailError("");
      setDetailLoading(true);

      try {
        const result = await paymentAuditApi.getAdminTimeline(item._id);
        if (requestId !== detailRequestIdRef.current) return;
        setDetailItem(result.item || item);
      } catch (detailLoadError: unknown) {
        if (requestId !== detailRequestIdRef.current) return;
        setDetailError(
          getErrorMessage(
            detailLoadError,
            t("paymentHistory.detail.loadFail")
          )
        );
      } finally {
        if (requestId === detailRequestIdRef.current) {
          setDetailLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    if (!detailItem) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetail();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDetail, detailItem]);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: t("paymentHistory.filter.status"),
        options: (
          ["PAID", "PENDING", "FAILED", "CANCELLED"] as const
        ).map((value) => ({
          id: value,
          label: t(STATUS_LABEL_KEYS[value]),
          checked: status === value,
          onToggle: () => {
            setPage(1);
            setStatus((current) => (current === value ? "" : value));
          },
        })),
      },
      {
        id: "time",
        title: t("paymentHistory.filter.time"),
        options: [
          {
            id: "today",
            label: t("paymentHistory.time.today"),
            value: "today" as const,
          },
          {
            id: "7d",
            label: t("paymentHistory.time.last7Days"),
            value: "7d" as const,
          },
          {
            id: "30d",
            label: t("paymentHistory.time.last30Days"),
            value: "30d" as const,
          },
        ].map((option) => ({
          id: option.id,
          label: option.label,
          checked: timeRange === option.value,
          onToggle: () => {
            setPage(1);
            setTimeRange((current) =>
              current === option.value ? "" : option.value
            );
          },
        })),
      },
    ],
    [status, t, timeRange]
  );

  const columns = useMemo<
    AdminTableColumn<PaymentAuditItem, PaymentHistorySortKey>[]
  >(
    () => [
      {
        id: "paymentCode",
        label: t("paymentHistory.column.order"),
        sortKey: "paymentCode",
        widthClassName: "w-[18%]",
        headerClassName: "break-words",
        render: (item) => (
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-semibold text-slate-950 dark:text-white">
              {getTransactionCode(item)}
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {getTransactionTypeLabel(item.type, locale)}
            </div>
          </div>
        ),
      },
      {
        id: "user",
        label: t("paymentHistory.column.customer"),
        widthClassName: "w-[18%]",
        headerClassName: "break-words",
        render: (item) => (
          <AdminEntityCell
            title={getUserName(item)}
            subtitle={item.user?.email || "-"}
            fallback={getInitials(item.user?.name, item.user?.email)}
            hideMedia
          />
        ),
      },
      {
        id: "provider",
        label: t("paymentHistory.column.provider"),
        sortKey: "provider",
        widthClassName: "w-[19%]",
        headerClassName: "whitespace-nowrap",
        render: (item) => <ProviderBadge locale={locale} provider={item.provider} />,
      },
      {
        id: "amount",
        label: t("paymentHistory.column.amount"),
        sortKey: "amount",
        widthClassName: "w-[13%]",
        headerClassName: "break-words",
        render: (item) => (
          <span
            className={cn(
              "whitespace-nowrap font-semibold",
              isDebitTransaction(item)
                ? "text-rose-600 dark:text-rose-300"
                : "text-slate-950 dark:text-white"
            )}
          >
            {formatSignedMoney(item, locale)}
          </span>
        ),
      },
      {
        id: "status",
        label: t("paymentHistory.column.status"),
        sortKey: "status",
        widthClassName: "w-[13%]",
        headerClassName: "break-words",
        render: (item) => (
          <StatusBadge
            status={item.status}
            label={t(STATUS_LABEL_KEYS[item.status])}
          />
        ),
      },
      {
        id: "createdAt",
        label: t("paymentHistory.column.createdAt"),
        sortKey: "createdAt",
        widthClassName: "w-[12%]",
        headerClassName: "break-words",
        cellClassName: "whitespace-nowrap",
        render: (item) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatDate(item.createdAt, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        label: t("paymentHistory.column.actions"),
        widthClassName: "w-[7%]",
        headerClassName: "whitespace-nowrap",
        align: "center",
        render: (item) => (
          <AdminActionIconButton
            title={t("paymentHistory.action.view")}
            onClick={() => void openDetail(item)}
          >
            <Eye className="h-4 w-4" />
          </AdminActionIconButton>
        ),
      },
    ],
    [locale, openDetail, t]
  );

  return (
    <main className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <AdminListTable<PaymentAuditItem, PaymentHistorySortKey>
        rows={items}
        columns={columns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder={t("paymentHistory.searchPlaceholder")}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setDebouncedSearch("");
          setStatus("");
          setTimeRange("");
          setPage(1);
        }}
        sortBy={sortKey}
        sortOrder={sortDirection}
        onSortChange={(nextSortBy, nextSortOrder) => {
          setSortKey(nextSortBy);
          setSortDirection(nextSortOrder);
          setPage(1);
        }}
        onReload={() => setRefreshKey((current) => current + 1)}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: total,
          pageSize,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          },
          onPageChange: setPage,
          pageSizeOptions: [10, 20, 50],
        }}
        emptyText={t("paymentHistory.empty")}
        labels={{
          apply: t("dict.apply"),
          clear: t("dict.clearFilter"),
          filter: t("dict.filter"),
          loading: t("paymentHistory.loading"),
          noData: t("dict.noData"),
          of: locale === "vi" ? "trên" : "of",
          reload: t("dict.reload"),
          rows: locale === "vi" ? "Dòng" : "Rows",
          search: t("dict.search"),
          showing: t("dict.showing"),
        }}
        tableMinWidthClassName="min-w-full"
        fitContainer
      />

      {detailItem ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-detail-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/10">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="payment-detail-title"
                    className="text-lg font-bold text-slate-950 dark:text-white"
                  >
                    {t("paymentHistory.detail.title")}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {getTransactionCode(detailItem)}
                    </span>
                    <StatusBadge
                      status={detailItem.status}
                      label={t(STATUS_LABEL_KEYS[detailItem.status])}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                title={t("paymentHistory.detail.close")}
                aria-label={t("paymentHistory.detail.close")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {detailLoading ? (
                <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                  {t("paymentHistory.detail.loading")}
                </div>
              ) : null}

              {detailError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                  {detailError}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <CircleDollarSign className="h-4 w-4" />
                    {t("paymentHistory.column.amount")}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-lg font-bold",
                      isDebitTransaction(detailItem)
                        ? "text-rose-600 dark:text-rose-300"
                        : "text-slate-950 dark:text-white"
                    )}
                  >
                    {formatSignedMoney(detailItem, locale)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <CreditCard className="h-4 w-4" />
                    {t("paymentHistory.column.provider")}
                  </div>
                  <div className="mt-2">
                    <ProviderBadge
                      locale={locale}
                      provider={detailItem.provider}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("paymentHistory.column.status")}
                  </div>
                  <div className="mt-2">
                    <StatusBadge
                      status={detailItem.status}
                      label={t(STATUS_LABEL_KEYS[detailItem.status])}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <UserRound className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                    {t("paymentHistory.detail.customer")}
                  </h3>
                  <div className="mt-4">
                    <AdminEntityCell
                      title={getUserName(detailItem)}
                      subtitle={detailItem.user?.email || "-"}
                      meta={detailItem.user?._id ? `ID: ${detailItem.user._id}` : undefined}
                      fallback={getInitials(
                        detailItem.user?.name,
                        detailItem.user?.email
                      )}
                      hideMedia
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                    <Hash className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                    {t("paymentHistory.detail.gateway")}
                  </h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">
                        {t("paymentHistory.column.provider")}
                      </dt>
                      <dd className="font-semibold text-slate-950 dark:text-white">
                        {getProviderLabel(detailItem.provider, locale)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">
                        {t("paymentHistory.detail.transactionCode")}
                      </dt>
                      <dd className="max-w-[65%] break-all text-right font-mono font-semibold text-slate-950 dark:text-white">
                        {detailItem.gatewayTransactionNo || "-"}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                  <Clock3 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  {t("paymentHistory.detail.timeline")}
                </h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: t("paymentHistory.detail.createdAt"),
                      value: detailItem.createdAt,
                    },
                    {
                      label: t("paymentHistory.detail.paidAt"),
                      value: detailItem.paidAt,
                    },
                    {
                      label: t("paymentHistory.detail.updatedAt"),
                      value: detailItem.updatedAt,
                    },
                  ].map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-white/[0.04]"
                    >
                      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {entry.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        {formatDate(entry.value, locale)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    {t("paymentHistory.detail.items")}
                  </h3>
                </div>
                {detailItem.items.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">{t("dict.course")}</th>
                          <th className="px-4 py-3 text-center">
                            {t("paymentHistory.detail.quantity")}
                          </th>
                          <th className="px-4 py-3 text-right">
                            {t("paymentHistory.detail.unitPrice")}
                          </th>
                          <th className="px-4 py-3 text-right">
                            {t("paymentHistory.detail.subtotal")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                        {detailItem.items.map((entry, index) => (
                          <tr key={`${entry.courseId}-${index}`}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-950 dark:text-white">
                                {entry.title}
                              </div>
                              <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {entry.courseId}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {entry.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatMoney(entry.unitPrice, locale)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                              {formatMoney(entry.subtotal, locale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t("paymentHistory.detail.noItems")}
                  </div>
                )}
              </section>

              <details className="rounded-xl border border-slate-200 dark:border-white/10">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-950 dark:text-white">
                  {t("paymentHistory.detail.rawData")}
                </summary>
                <div className="border-t border-slate-200 p-4 dark:border-white/10">
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                    {formatGatewayPayload(
                      detailItem.gatewayPayload,
                      t("paymentHistory.detail.noRawData")
                    )}
                  </pre>
                </div>
              </details>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
