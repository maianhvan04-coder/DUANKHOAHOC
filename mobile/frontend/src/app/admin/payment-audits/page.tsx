"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import {
  paymentAuditApi,
  type PaymentAuditItem,
  type PaymentHistoryProvider,
  type PaymentHistoryStatus,
} from "@/app/api/payment-audit.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { SortDirection } from "@/lib/utils/admin-list";

type PaymentAuditSortKey =
  | "paymentCode"
  | "user"
  | "provider"
  | "amount"
  | "status"
  | "createdAt";

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

function formatOrderCode(paymentCode: number) {
  return `ORD-${String(paymentCode || 0).padStart(8, "0")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function formatProvider(provider: PaymentHistoryProvider) {
  return provider.toUpperCase();
}

function getUserName(item: PaymentAuditItem) {
  return item.user?.name?.trim() || "-";
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "-").trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function parsePaymentCode(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function statusConfig(status: PaymentHistoryStatus) {
  switch (status) {
    case "PAID":
      return { label: "Thành công", tone: "success" as const };
    case "FAILED":
      return { label: "Thất bại", tone: "danger" as const };
    case "CANCELLED":
      return { label: "Đã hủy", tone: "neutral" as const };
    case "PENDING":
    default:
      return { label: "Chờ xử lý", tone: "warning" as const };
  }
}

function StatusBadge({ status }: { status: PaymentHistoryStatus }) {
  const config = statusConfig(status);

  return <AdminStatusBadge tone={config.tone}>{config.label}</AdminStatusBadge>;
}

function ProviderBadge({ provider }: { provider: PaymentHistoryProvider }) {
  return (
    <span className="inline-flex h-7 items-center rounded-xl bg-slate-100 px-3 text-xs font-medium uppercase text-slate-700 dark:bg-white/10 dark:text-slate-100">
      {formatProvider(provider)}
    </span>
  );
}

export default function AdminPaymentAuditsPage() {
  const [items, setItems] = useState<PaymentAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<"" | PaymentHistoryProvider>("");
  const [status, setStatus] = useState<"" | PaymentHistoryStatus>("");
  const [sortKey, setSortKey] = useState<PaymentAuditSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailItem, setDetailItem] = useState<PaymentAuditItem | null>(null);

  const activeFilterCount = [provider, status].filter(Boolean).length;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const keyword = search.trim();
      const paymentCode = parsePaymentCode(keyword);
      const result = await paymentAuditApi.getAdminList({
        page,
        limit: pageSize,
        paymentCode,
        userKeyword: paymentCode ? undefined : keyword || undefined,
        provider: provider || undefined,
        status: status || undefined,
      });

      setItems(result.items);
      setPage(result.pagination.page);
      setPageSize(result.pagination.limit);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages || 1, 1));
    } catch (loadError: unknown) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(getErrorMessage(loadError, "Không tải được dữ liệu thanh toán"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, provider, search, status]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "provider",
        title: "Phương thức",
        options: [
          {
            id: "vnpay",
            label: "VNPAY",
            checked: provider === "vnpay",
            onToggle: () => {
              setPage(1);
              setProvider((prev) => (prev === "vnpay" ? "" : "vnpay"));
            },
          },
          {
            id: "payos",
            label: "PAYOS",
            checked: provider === "payos",
            onToggle: () => {
              setPage(1);
              setProvider((prev) => (prev === "payos" ? "" : "payos"));
            },
          },
        ],
      },
      {
        id: "status",
        title: "Trạng thái",
        options: [
          {
            id: "paid",
            label: "Thành công",
            checked: status === "PAID",
            onToggle: () => {
              setPage(1);
              setStatus((prev) => (prev === "PAID" ? "" : "PAID"));
            },
          },
          {
            id: "pending",
            label: "Chờ xử lý",
            checked: status === "PENDING",
            onToggle: () => {
              setPage(1);
              setStatus((prev) => (prev === "PENDING" ? "" : "PENDING"));
            },
          },
          {
            id: "failed",
            label: "Thất bại",
            checked: status === "FAILED",
            onToggle: () => {
              setPage(1);
              setStatus((prev) => (prev === "FAILED" ? "" : "FAILED"));
            },
          },
          {
            id: "cancelled",
            label: "Đã hủy",
            checked: status === "CANCELLED",
            onToggle: () => {
              setPage(1);
              setStatus((prev) => (prev === "CANCELLED" ? "" : "CANCELLED"));
            },
          },
        ],
      },
    ],
    [provider, status]
  );

  const sortedItems = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      let left: string | number = "";
      let right: string | number = "";

      if (sortKey === "paymentCode") {
        left = a.paymentCode;
        right = b.paymentCode;
      } else if (sortKey === "user") {
        left = getUserName(a);
        right = getUserName(b);
      } else if (sortKey === "provider") {
        left = a.provider;
        right = b.provider;
      } else if (sortKey === "amount") {
        left = a.amount;
        right = b.amount;
      } else if (sortKey === "status") {
        left = a.status;
        right = b.status;
      } else {
        left = new Date(a.paidAt || a.createdAt).getTime();
        right = new Date(b.paidAt || b.createdAt).getTime();
      }

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * multiplier;
      }

      return String(left).localeCompare(String(right), "vi") * multiplier;
    });
  }, [items, sortDirection, sortKey]);

  const columns = useMemo<
    AdminTableColumn<PaymentAuditItem, PaymentAuditSortKey>[]
  >(
    () => [
      {
        id: "paymentCode",
        label: "Mã đơn hàng",
        sortKey: "paymentCode",
        widthClassName: "w-[15%]",
        render: (item) => (
          <span className="font-medium text-slate-950 dark:text-white">
            {formatOrderCode(item.paymentCode)}
          </span>
        ),
      },
      {
        id: "user",
        label: "Người dùng",
        sortKey: "user",
        widthClassName: "w-[24%]",
        render: (item) => (
          <AdminEntityCell
            title={getUserName(item)}
            subtitle={item.user?.email || "-"}
            fallback={getInitials(item.user?.name, item.user?.email)}
          />
        ),
      },
      {
        id: "provider",
        label: "Phương thức",
        sortKey: "provider",
        widthClassName: "w-[13%]",
        render: (item) => <ProviderBadge provider={item.provider} />,
      },
      {
        id: "amount",
        label: "Giá",
        sortKey: "amount",
        widthClassName: "w-[14%]",
        render: (item) => (
          <span className="font-medium text-slate-950 dark:text-white">
            {formatMoney(item.amount)}
          </span>
        ),
      },
      {
        id: "status",
        label: "Trạng thái",
        sortKey: "status",
        widthClassName: "w-[14%]",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        id: "createdAt",
        label: "Ngày mua",
        sortKey: "createdAt",
        widthClassName: "w-[14%]",
        cellClassName: "whitespace-nowrap",
        render: (item) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatDate(item.paidAt || item.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        label: "Hành động",
        widthClassName: "w-[6%]",
        align: "right",
        render: (item) => (
          <AdminActionIconButton title="Xem" onClick={() => setDetailItem(item)}>
            <Eye className="h-4 w-4" />
          </AdminActionIconButton>
        ),
      },
    ],
    []
  );

  return (
    <main className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <AdminListTable<PaymentAuditItem, PaymentAuditSortKey>
        rows={sortedItems}
        columns={columns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder="Tìm theo mã đơn hoặc người dùng..."
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setProvider("");
          setStatus("");
          setPage(1);
        }}
        sortBy={sortKey}
        sortOrder={sortDirection}
        onSortChange={(nextSortBy, nextSortOrder) => {
          setSortKey(nextSortBy);
          setSortDirection(nextSortOrder);
        }}
        onReload={() => setRefreshKey((prev) => prev + 1)}
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
        emptyText="Chưa có giao dịch phù hợp"
        labels={{
          apply: "Áp dụng",
          clear: "Xóa lọc",
          filter: "Lọc",
          loading: "Đang tải giao dịch...",
          noData: "Không có dữ liệu",
          of: "trên",
          reload: "Làm mới",
          rows: "Dòng",
          search: "Tìm kiếm",
          showing: "Hiển thị",
        }}
        tableMinWidthClassName="min-w-full"
      />

      {detailItem ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formatOrderCode(detailItem.paymentCode)}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {getUserName(detailItem)} · {detailItem.user?.email || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Phương thức
                  </div>
                  <div className="mt-2">
                    <ProviderBadge provider={detailItem.provider} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Giá
                  </div>
                  <div className="mt-1 font-medium text-slate-950 dark:text-white">
                    {formatMoney(detailItem.amount)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Trạng thái
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={detailItem.status} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-950 dark:border-white/10 dark:text-white">
                  Gói đã mua
                </div>
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {detailItem.items.length ? (
                    detailItem.items.map((entry) => (
                      <div
                        key={`${entry.courseId}-${entry.title}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-950 dark:text-white">
                            {entry.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            SL: {entry.quantity}
                          </div>
                        </div>
                        <div className="shrink-0 font-medium text-slate-950 dark:text-white">
                          {formatMoney(entry.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      Không có gói
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
