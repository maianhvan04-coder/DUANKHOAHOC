"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Bell,
  BrushCleaning,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Info,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationItem,
  NotificationRecipientItem,
  NotificationType,
  NotificationUserItem,
} from "@/app/api/notification.api";

export type NotificationHistoryReadFilter = "" | "true" | "false";
export type NotificationHistorySortBy =
  | "createdAt"
  | "title"
  | "type"
  | "isRead"
  | "readAt";
export type NotificationHistorySortOrder = "asc" | "desc";

type NotificationHistoryTableProps = {
  keyword: string;
  filterUserId: string;
  filterType: "" | NotificationType;
  filterRead: NotificationHistoryReadFilter;
  sortBy: NotificationHistorySortBy;
  sortOrder: NotificationHistorySortOrder;
  loading: boolean;
  errorMessage?: string;
  items: NotificationItem[];
  users: NotificationRecipientItem[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageStart: number;
  pageEnd: number;
  deletingId?: string | null;
  onKeywordChange: (value: string) => void;
  onFilterUserIdChange: (value: string) => void;
  onFilterTypeChange: (value: "" | NotificationType) => void;
  onFilterReadChange: (value: NotificationHistoryReadFilter) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onSortChange: (
    sortBy: NotificationHistorySortBy,
    sortOrder: NotificationHistorySortOrder
  ) => void;
  onReload: () => void;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
  onRemove: (item: NotificationItem) => void;
};

type TypeMeta = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
};

const TYPE_OPTIONS: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR"];

const TYPE_META: Record<NotificationType, TypeMeta> = {
  INFO: {
    label: "Thông tin",
    icon: Info,
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200",
  },
  SUCCESS: {
    label: "Thành công",
    icon: CheckCircle2,
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  WARNING: {
    label: "Cảnh báo",
    icon: AlertTriangle,
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
  },
  ERROR: {
    label: "Lỗi",
    icon: XCircle,
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isUserObject(
  value: string | NotificationUserItem | null | undefined
): value is NotificationUserItem {
  return typeof value === "object" && value !== null;
}

function getUserName(value: string | NotificationUserItem | null | undefined) {
  if (!isUserObject(value)) return "Người dùng";
  return value.name || value.email || "Người dùng";
}

function getUserEmail(value: string | NotificationUserItem | null | undefined) {
  if (!isUserObject(value)) return typeof value === "string" ? value : "-";
  return value.email || "-";
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "ND").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN");
}

function TypeBadge({ type }: { type: NotificationType }) {
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
      {type}
    </span>
  );
}

function StatusBadge({ isRead }: { isRead: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        isRead
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
      )}
    >
      {isRead ? "Đã đọc" : "Chưa đọc"}
    </span>
  );
}

function ActionButton({
  children,
  danger,
  onClick,
  title,
  disabled,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/20"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

export default function NotificationHistoryTable({
  keyword,
  filterUserId,
  filterType,
  filterRead,
  sortBy,
  sortOrder,
  loading,
  errorMessage,
  items,
  users,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageStart,
  pageEnd,
  deletingId,
  onKeywordChange,
  onFilterUserIdChange,
  onFilterTypeChange,
  onFilterReadChange,
  onApplyFilters,
  onClearFilters,
  onSortChange,
  onReload,
  onPageSizeChange,
  onPageChange,
  onRemove,
}: NotificationHistoryTableProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!filterPopoverRef.current) return;
      if (!filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isFilterOpen]);

  const activeFilterCount = useMemo(() => {
    return [filterUserId, filterType, filterRead].filter(Boolean).length;
  }, [filterRead, filterType, filterUserId]);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handleSortClick = useCallback(
    (nextSortBy: NotificationHistorySortBy) => {
      if (sortBy === nextSortBy) {
        onSortChange(nextSortBy, sortOrder === "asc" ? "desc" : "asc");
        return;
      }

      onSortChange(nextSortBy, "asc");
    },
    [onSortChange, sortBy, sortOrder]
  );

  const renderSortIcon = useCallback(
    (column: NotificationHistorySortBy) => {
      if (sortBy !== column) {
        return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />;
      }

      return sortOrder === "asc" ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5" />
      );
    },
    [sortBy, sortOrder]
  );

  const renderSortableHeader = useCallback(
    (label: string, columnSortKey: NotificationHistorySortBy) => {
      const isActive = sortBy === columnSortKey;

      return (
        <button
          type="button"
          onClick={() => handleSortClick(columnSortKey)}
          className={cn(
            "inline-flex items-center gap-1.5 bg-transparent p-0 text-left text-xs font-extrabold uppercase tracking-[0.14em] transition",
            isActive ? "text-white" : "text-white/80 hover:text-white"
          )}
        >
          <span>{label}</span>
          {renderSortIcon(columnSortKey)}
        </button>
      );
    },
    [handleSortClick, renderSortIcon, sortBy]
  );

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-slate-100">Lịch sử thông báo</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Tìm kiếm, lọc, sắp xếp và phân trang trực tiếp trên dữ liệu backend.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
          Trang <span className="font-black text-slate-950 dark:text-slate-100">{currentPage}</span> /{" "}
          {totalPages}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm tiêu đề, nội dung, người nhận"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-white/10"
            />
          </div>

          <div ref={filterPopoverRef} className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              <span>Lọc</span>
              <span>({activeFilterCount})</span>
            </button>

            {isFilterOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-[380px] max-w-[92vw] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:shadow-black/30">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Người nhận
                    </label>
                    <select
                      value={filterUserId}
                      onChange={(event) => onFilterUserIdChange(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-white/10"
                    >
                      <option value="">Tất cả người nhận</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name || user.email} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Loại
                      </label>
                      <select
                        value={filterType}
                        onChange={(event) =>
                          onFilterTypeChange(event.target.value as "" | NotificationType)
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-white/10"
                      >
                        <option value="">Tất cả loại</option>
                        {TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Trạng thái
                      </label>
                      <select
                        value={filterRead}
                        onChange={(event) =>
                          onFilterReadChange(event.target.value as NotificationHistoryReadFilter)
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-white/10"
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="false">Chưa đọc</option>
                        <option value="true">Đã đọc</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyFilters();
                      setIsFilterOpen(false);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onKeywordChange("");
                onClearFilters();
              }}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <BrushCleaning className="h-4 w-4" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={onReload}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
              title="Lam moi"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full table-fixed">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="w-[340px] px-5 py-4 text-left">
                  {renderSortableHeader("Tiêu đề", "title")}
                </th>
                <th className="w-[250px] px-5 py-4 text-left">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/80">
                    Người nhận
                  </span>
                </th>
                <th className="w-[130px] px-5 py-4 text-left">
                  {renderSortableHeader("Loại", "type")}
                </th>
                <th className="w-[130px] px-5 py-4 text-left">
                  {renderSortableHeader("Trạng thái", "isRead")}
                </th>
                <th className="w-[190px] px-5 py-4 text-left">
                  {renderSortableHeader("Tạo lúc", "createdAt")}
                </th>
                <th className="w-[190px] px-5 py-4 text-left">
                  {renderSortableHeader("Đọc lúc", "readAt")}
                </th>
                <th className="w-[170px] px-5 py-4 text-left">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/80">
                    Người tạo
                  </span>
                </th>
                <th className="w-[96px] px-5 py-4 text-center">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/80">
                    Action
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/10 dark:bg-slate-950/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-2/3 rounded-full bg-slate-100" />
                      <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-8 w-24 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-8 w-24 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="mx-auto h-9 w-9 rounded-full bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400">
                      <Bell className="h-7 w-7" />
                    </div>
                    <div className="mt-5 text-xl font-black text-slate-900">
                      Chưa có thông báo phù hợp
                    </div>
                    <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Thử đổi bộ lọc, từ khóa tìm kiếm hoặc tạo một thông báo mới.
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const userName = getUserName(item.userId);
                  const userEmail = getUserEmail(item.userId);
                  const createdByName = getUserName(item.createdBy);

                  return (
                    <tr key={item._id} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-white/5">
                      <td className="px-5 py-4">
                        <div className="text-sm font-black text-slate-950">{item.title}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">
                          {item.message}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                            {getInitials(userName, userEmail)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900">
                              {userName}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <TypeBadge type={item.type} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge isRead={item.isRead} />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDate(item.readAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {createdByName}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ActionButton
                          danger
                          title="Xóa thông báo"
                          onClick={() => onRemove(item)}
                          disabled={deletingId === item._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-white/10 dark:bg-slate-950/70">
          <div className="text-sm font-semibold text-slate-500">
            Hiển thị <span className="text-slate-950">{pageStart}</span> -{" "}
            <span className="text-slate-950">{pageEnd}</span> /{" "}
            <span className="text-slate-950">{totalItems}</span> thông báo
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option} / trang
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => hasPrev && onPageChange(currentPage - 1)}
              disabled={!hasPrev || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>

            <button
              type="button"
              onClick={() => hasNext && onPageChange(currentPage + 1)}
              disabled={!hasNext || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
