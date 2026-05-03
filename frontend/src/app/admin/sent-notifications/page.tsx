"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  MailPlus,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminNotificationApi,
  type NotificationItem,
  type NotificationRecipientItem,
  type NotificationType,
} from "@/app/api/notification.api";
import NotificationHistoryTable, {
  type NotificationHistoryReadFilter,
  type NotificationHistorySortBy,
  type NotificationHistorySortOrder,
} from "@/components/ui/admin/notifications/NotificationHistoryTable";
import { emitNotificationChanged } from "@/lib/utils/notification-events";

type ReadFilter = NotificationHistoryReadFilter;

type NotificationFilters = {
  keyword: string;
  userId: string;
  type: "" | NotificationType;
  isRead: ReadFilter;
  sortBy: NotificationHistorySortBy;
  sortOrder: NotificationHistorySortOrder;
};

type StatTone = "slate" | "blue" | "emerald" | "amber";

const DEFAULT_QUERY: NotificationFilters = {
  keyword: "",
  userId: "",
  type: "",
  isRead: "",
  sortBy: "createdAt",
  sortOrder: "desc",
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

function StatCard({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: StatTone;
}) {
  const toneClass: Record<StatTone, string> = {
    slate:
      "border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100",
    blue: "border-blue-100 bg-blue-50 text-blue-900 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-100",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
    amber:
      "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
  };

  const iconClass: Record<StatTone, string> = {
    slate: "bg-slate-900 text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div className={cn("rounded-[26px] border p-5 shadow-sm", toneClass[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            iconClass[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminSentNotificationsPage() {
  const [users, setUsers] = useState<NotificationRecipientItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<NotificationHistorySortBy>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<NotificationHistorySortOrder>("desc");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterType, setFilterType] = useState<"" | NotificationType>("");
  const [filterRead, setFilterRead] = useState<ReadFilter>("");
  const [query, setQuery] = useState<NotificationFilters>(DEFAULT_QUERY);

  const stats = useMemo(() => {
    const unread = items.filter((item) => !item.isRead).length;
    const read = items.filter((item) => item.isRead).length;

    return {
      shown: items.length,
      read,
      unread,
    };
  }, [items]);

  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const result = await adminNotificationApi.getRecipients({
        limit: 500,
      });
      setUsers(result.data.items);
    } catch (loadError: unknown) {
      toast.error(getErrorMessage(loadError, "Không tải được danh sách người dùng"));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadNotifications = useCallback(
    async (
      nextPage: number,
      nextQuery: NotificationFilters,
      nextPageSize: number
    ) => {
      try {
        setLoadingItems(true);
        setError("");

        const result = await adminNotificationApi.getAll({
          page: nextPage,
          limit: nextPageSize,
          keyword: nextQuery.keyword.trim() || undefined,
          userId: nextQuery.userId || undefined,
          type: nextQuery.type || undefined,
          isRead: nextQuery.isRead || undefined,
          sortBy: nextQuery.sortBy,
          sortOrder: nextQuery.sortOrder,
        });

        const data = result.data;
        const pagination = data.pagination ?? {
          page: nextPage,
          limit: nextPageSize,
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
        setError(getErrorMessage(loadError, "Không tải được lịch sử thông báo"));
      } finally {
        setLoadingItems(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadNotifications(page, query, pageSize);
  }, [loadNotifications, page, pageSize, query, refreshKey]);

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      keyword: value,
    }));
  }

  function handleSortChange(
    nextSortBy: NotificationHistorySortBy,
    nextSortOrder: NotificationHistorySortOrder
  ) {
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      sortBy: nextSortBy,
      sortOrder: nextSortOrder,
    }));
  }

  function applyFilters() {
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      userId: filterUserId,
      type: filterType,
      isRead: filterRead,
    }));
  }

  function resetFilters() {
    setFilterUserId("");
    setFilterType("");
    setFilterRead("");
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      userId: "",
      type: "",
      isRead: "",
    }));
  }

  function handleReloadHistory() {
    setRefreshKey((prev) => prev + 1);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  async function handleRemove(item: NotificationItem) {
    const ok = window.confirm(`Xóa thông báo "${item.title}"?`);
    if (!ok) return;

    try {
      setDeletingId(item._id);
      await adminNotificationApi.remove(item._id);
      emitNotificationChanged();
      toast.success("Đã xóa thông báo");

      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (removeError: unknown) {
      toast.error(getErrorMessage(removeError, "Xóa thông báo thất bại"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>

      <main className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <Bell className="h-4 w-4" />
                Lịch sử thông báo
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Theo dõi thông báo đã gửi, kiểm tra trạng thái đã đọc và dọn dữ
                liệu cũ ngay trong nhóm `AUDIT`.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void loadUsers()}
                disabled={loadingUsers}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <UsersRound className="h-4 w-4" />
                {loadingUsers ? "Đang tải người dùng..." : "Tải người dùng"}
              </button>

              <button
                type="button"
                onClick={handleReloadHistory}
                disabled={loadingItems}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={cn("h-4 w-4", loadingItems && "animate-spin")}
                />
                Làm mới
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tổng thông báo"
            value={total}
            icon={<Bell className="h-5 w-5" />}
            tone="slate"
          />
          <StatCard
            label="Đang hiển thị"
            value={stats.shown}
            icon={<MailPlus className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            label="Chưa đọc"
            value={stats.unread}
            icon={<Clock3 className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="Đã đọc"
            value={stats.read}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="emerald"
          />
        </section>

        <NotificationHistoryTable
          keyword={keyword}
          filterUserId={filterUserId}
          filterType={filterType}
          filterRead={filterRead}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loadingItems}
          errorMessage={error}
          items={items}
          users={users}
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          pageStart={pageStart}
          pageEnd={pageEnd}
          deletingId={deletingId}
          onKeywordChange={handleKeywordChange}
          onFilterUserIdChange={setFilterUserId}
          onFilterTypeChange={setFilterType}
          onFilterReadChange={setFilterRead}
          onApplyFilters={applyFilters}
          onClearFilters={resetFilters}
          onSortChange={handleSortChange}
          onReload={handleReloadHistory}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={setPage}
          onRemove={handleRemove}
        />
      </main>
    </>
  );
}
