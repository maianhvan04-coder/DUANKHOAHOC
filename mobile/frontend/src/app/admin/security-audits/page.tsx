"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import {
  securityAuditApi,
  type SecurityAuditItem,
} from "@/app/api/security-audit.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { SortDirection } from "@/lib/utils/admin-list";

const ACTION_OPTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "REGISTER",
  "REFRESH_TOKEN",
  "ACCESS_GRANTED",
  "ACCESS_DENIED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_SUCCESS",
] as const;

type SuccessFilter = "" | "true" | "false";
type SecurityAuditSortKey =
  | "user"
  | "action"
  | "path"
  | "ipAddress"
  | "success"
  | "statusCode"
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

function formatDate(value?: string) {
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

function getAuditName(item: SecurityAuditItem) {
  return item.user?.name || item.userName || "Người dùng hệ thống";
}

function getAuditEmail(item: SecurityAuditItem) {
  return item.user?.email || item.userEmail || "-";
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "-").trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700 dark:bg-white/10 dark:text-slate-100">
      <span className="truncate">{action || "-"}</span>
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex h-6 min-w-[58px] items-center justify-center rounded-lg bg-sky-50 px-2 text-xs font-medium uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
      {method || "-"}
    </span>
  );
}

function ResultBadge({ success }: { success: boolean }) {
  return (
    <AdminStatusBadge tone={success ? "success" : "danger"}>
      {success ? "Thành công" : "Từ chối"}
    </AdminStatusBadge>
  );
}

export default function AdminSecurityAuditsPage() {
  const [items, setItems] = useState<SecurityAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [success, setSuccess] = useState<SuccessFilter>("");
  const [sortKey, setSortKey] = useState<SecurityAuditSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailItem, setDetailItem] = useState<SecurityAuditItem | null>(null);

  const activeFilterCount = [action, success].filter(Boolean).length;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await securityAuditApi.getAdminList({
        page,
        limit: pageSize,
        keyword: search.trim() || undefined,
        action: action || undefined,
        success: success === "" ? undefined : success === "true",
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
      setError(getErrorMessage(loadError, "Không tải được kiểm tra bảo mật"));
    } finally {
      setLoading(false);
    }
  }, [action, page, pageSize, search, success]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "action",
        title: "Thao tác",
        options: ACTION_OPTIONS.map((item) => ({
          id: item,
          label: item,
          checked: action === item,
          onToggle: () => {
            setPage(1);
            setAction((prev) => (prev === item ? "" : item));
          },
        })),
      },
      {
        id: "success",
        title: "Kết quả",
        options: [
          {
            id: "success",
            label: "Thành công",
            checked: success === "true",
            onToggle: () => {
              setPage(1);
              setSuccess((prev) => (prev === "true" ? "" : "true"));
            },
          },
          {
            id: "failed",
            label: "Từ chối",
            checked: success === "false",
            onToggle: () => {
              setPage(1);
              setSuccess((prev) => (prev === "false" ? "" : "false"));
            },
          },
        ],
      },
    ],
    [action, success]
  );

  const sortedItems = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      let left: string | number = "";
      let right: string | number = "";

      if (sortKey === "user") {
        left = getAuditName(a);
        right = getAuditName(b);
      } else if (sortKey === "action") {
        left = a.action;
        right = b.action;
      } else if (sortKey === "path") {
        left = `${a.method} ${a.path}`;
        right = `${b.method} ${b.path}`;
      } else if (sortKey === "ipAddress") {
        left = a.ipAddress;
        right = b.ipAddress;
      } else if (sortKey === "success") {
        left = a.success ? 1 : 0;
        right = b.success ? 1 : 0;
      } else if (sortKey === "statusCode") {
        left = Number(a.statusCode || 0);
        right = Number(b.statusCode || 0);
      } else {
        left = new Date(a.createdAt).getTime();
        right = new Date(b.createdAt).getTime();
      }

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * multiplier;
      }

      return String(left).localeCompare(String(right), "vi") * multiplier;
    });
  }, [items, sortDirection, sortKey]);

  const columns = useMemo<
    AdminTableColumn<SecurityAuditItem, SecurityAuditSortKey>[]
  >(
    () => [
      {
        id: "user",
        label: "Người dùng",
        sortKey: "user",
        widthClassName: "w-[22%]",
        render: (item) => {
          const name = getAuditName(item);
          const email = getAuditEmail(item);

          return (
            <AdminEntityCell
              title={name}
              subtitle={email}
              fallback={getInitials(name, email)}
            />
          );
        },
      },
      {
        id: "action",
        label: "Thao tác",
        sortKey: "action",
        widthClassName: "w-[17%]",
        render: (item) => <ActionBadge action={item.action} />,
      },
      {
        id: "path",
        label: "Route",
        sortKey: "path",
        widthClassName: "w-[28%]",
        render: (item) => (
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <MethodBadge method={item.method} />
              <span className="min-w-0 truncate font-mono text-xs font-medium text-slate-700 dark:text-slate-200">
                {item.path || "-"}
              </span>
            </div>
            <div className="mt-1 truncate font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
              IP: {item.ipAddress || "-"} · HTTP {item.statusCode || "-"}
            </div>
          </div>
        ),
      },
      {
        id: "success",
        label: "Kết quả",
        sortKey: "success",
        widthClassName: "w-[13%]",
        render: (item) => <ResultBadge success={item.success} />,
      },
      {
        id: "createdAt",
        label: "Thời gian",
        sortKey: "createdAt",
        widthClassName: "w-[14%]",
        cellClassName: "whitespace-nowrap",
        render: (item) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatDate(item.createdAt)}
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

      <AdminListTable<SecurityAuditItem, SecurityAuditSortKey>
        rows={sortedItems}
        columns={columns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder="Tìm tên, email, route, IP, thao tác..."
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setAction("");
          setSuccess("");
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
        emptyText="Chưa có bản ghi bảo mật phù hợp"
        labels={{
          apply: "Áp dụng",
          clear: "Xóa lọc",
          filter: "Lọc",
          loading: "Đang tải bản ghi bảo mật...",
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
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-950 dark:text-white">
                  {detailItem.action || "Security Audit"}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {getAuditName(detailItem)} · {getAuditEmail(detailItem)}
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
                    Kết quả
                  </div>
                  <div className="mt-2">
                    <ResultBadge success={detailItem.success} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    HTTP
                  </div>
                  <div className="mt-1 font-medium text-slate-950 dark:text-white">
                    {detailItem.statusCode || "-"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Thời gian
                  </div>
                  <div className="mt-1 font-medium text-slate-950 dark:text-white">
                    {formatDate(detailItem.createdAt)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    Route
                  </div>
                  <div className="mt-2 flex min-w-0 items-center gap-2">
                    <MethodBadge method={detailItem.method} />
                    <span className="min-w-0 break-all font-mono text-sm font-medium text-slate-950 dark:text-white">
                      {detailItem.path || "-"}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    IP
                  </div>
                  <div className="mt-1 break-all font-mono text-sm font-medium text-slate-950 dark:text-white">
                    {detailItem.ipAddress || "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
                <div className="text-xs font-medium uppercase text-slate-400">
                  Message
                </div>
                <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {detailItem.message || "-"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
                <div className="text-xs font-medium uppercase text-slate-400">
                  User Agent
                </div>
                <div className="mt-2 break-all text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {detailItem.userAgent || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
