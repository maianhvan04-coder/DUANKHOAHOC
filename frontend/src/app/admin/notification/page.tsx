"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Info,
  MailPlus,
  RefreshCw,
  Search,
  Send,
  UsersRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Toaster, toast } from "sonner";
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

type ReadFilter = NotificationHistoryReadFilter;

type NotificationFilters = {
  keyword: string;
  userId: string;
  type: "" | NotificationType;
  isRead: ReadFilter;
  sortBy: NotificationHistorySortBy;
  sortOrder: NotificationHistorySortOrder;
};

type NotificationFormState = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
};

type TypeMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  softClass: string;
};

const TYPE_META: Record<NotificationType, TypeMeta> = {
  INFO: {
    label: "Thông tin",
    description: "Thông báo chung cho người dùng.",
    icon: Info,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    softClass: "bg-blue-50 text-blue-700",
  },
  SUCCESS: {
    label: "Thành công",
    description: "Xác nhận thao tác hoặc tiến độ tích cực.",
    icon: CheckCircle2,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    softClass: "bg-emerald-50 text-emerald-700",
  },
  WARNING: {
    label: "Cảnh báo",
    description: "Nhắc người dùng chú ý hoặc cần xử lý.",
    icon: AlertTriangle,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    softClass: "bg-amber-50 text-amber-700",
  },
  ERROR: {
    label: "Lỗi",
    description: "Thông báo vấn đề hoặc trạng thái thất bại.",
    icon: XCircle,
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    softClass: "bg-rose-50 text-rose-700",
  },
};

const TYPE_OPTIONS: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR"];

const EMPTY_FORM: NotificationFormState = {
  userId: "",
  title: "",
  message: "",
  type: "INFO",
};

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

function getInitials(name?: string, email?: string) {
  const source = (name || email || "ND").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
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
  tone?: "slate" | "blue" | "emerald" | "amber";
}) {
  const toneClass = {
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-blue-100 bg-blue-50 text-blue-900",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
  };

  const iconClass = {
    slate: "bg-slate-900 text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div className={cn("rounded-[26px] border p-5 shadow-sm", toneClass[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-bold text-slate-700">{children}</label>;
}

function formatUserOption(user: NotificationRecipientItem) {
  return `${user.name || user.email} - ${user.email}`;
}

export default function AdminNotificationPage() {
  const [users, setUsers] = useState<NotificationRecipientItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState<NotificationFormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState<NotificationHistorySortBy>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<NotificationHistorySortOrder>("desc");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterType, setFilterType] = useState<"" | NotificationType>("");
  const [filterRead, setFilterRead] = useState<ReadFilter>("");
  const [query, setQuery] = useState<NotificationFilters>(DEFAULT_QUERY);

  const selectedUser = useMemo(
    () => users.find((user) => user._id === form.userId) ?? null,
    [form.userId, users]
  );

  const filteredUserOptions = useMemo(() => {
    const normalizedKeyword = userSearch.trim().toLowerCase();
    const activeUsers = users.filter((user) => user.active !== false);
    const matches = normalizedKeyword
      ? activeUsers.filter((user) =>
          `${user.name} ${user.email} ${user.role || ""}`
            .toLowerCase()
            .includes(normalizedKeyword)
        )
      : activeUsers;

    const limited = matches.slice(0, 30);
    const selected = activeUsers.find((user) => user._id === form.userId);

    if (selected && !limited.some((user) => user._id === selected._id)) {
      return [selected, ...limited].slice(0, 30);
    }

    return limited;
  }, [form.userId, userSearch, users]);

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
      const data = result.data.items;
      setUsers(data);
      setForm((prev) =>
        prev.userId
          ? prev
          : {
              ...prev,
              userId: data.find((user) => user.active !== false)?._id ?? "",
            }
      );
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
        setError(getErrorMessage(loadError, "Không tải được danh sách thông báo"));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.userId) {
      toast.warning("Vui lòng chọn người nhận");
      return;
    }

    if (!form.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề");
      return;
    }

    if (!form.message.trim()) {
      toast.warning("Vui lòng nhập nội dung thông báo");
      return;
    }

    try {
      setSending(true);
      const result = await adminNotificationApi.create({
        userId: form.userId,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      });

      toast.success(result.message || "Đã gửi thông báo thành công");
      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
      }));
      setPage(1);
      setRefreshKey((prev) => prev + 1);
    } catch (submitError: unknown) {
      toast.error(getErrorMessage(submitError, "Gửi thông báo thất bại"));
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(item: NotificationItem) {
    const ok = window.confirm(`Xóa thông báo "${item.title}"?`);
    if (!ok) return;

    try {
      setDeletingId(item._id);
      await adminNotificationApi.remove(item._id);
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
      <Toaster richColors position="top-right" />

      <main className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                <Bell className="h-4 w-4" />
                Trung tâm thông báo
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Gửi thông báo cho người dùng
              </h1>

              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                Tạo thông báo từ admin, gửi đến từng tài khoản và theo dõi trạng thái
                đã đọc ngay trên cùng một màn hình.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => void loadUsers()}
                disabled={loadingUsers}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UsersRound className="h-4 w-4" />
                Tải user
              </button>

              <button
                type="button"
                onClick={handleReloadHistory}
                disabled={loadingItems}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn("h-4 w-4", loadingItems && "animate-spin")} />
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

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">Tạo thông báo mới</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Nội dung sẽ xuất hiện trong khu vực thông báo của người dùng được
                chọn.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <FieldLabel>Tìm người nhận</FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Tên, email hoặc vai trò"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Người nhận</FieldLabel>
                <select
                  value={form.userId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, userId: event.target.value }))
                  }
                  disabled={loadingUsers}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingUsers ? "Đang tải người dùng..." : "Chọn người nhận"}
                  </option>
                  {filteredUserOptions.map((user) => (
                    <option key={user._id} value={user._id}>
                      {formatUserOption(user)}
                    </option>
                  ))}
                </select>

                {selectedUser ? (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                      {getInitials(selectedUser.name, selectedUser.email)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">
                        {selectedUser.name || "Người dùng"}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Loại thông báo</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((type) => {
                    const meta = TYPE_META[type];
                    const Icon = meta.icon;
                    const active = form.type === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, type }))}
                        className={cn(
                          "rounded-2xl border p-3 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2 text-sm font-black">
                          <Icon className="h-4 w-4" />
                          {type}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-xs leading-5",
                            active ? "text-slate-200" : "text-slate-500"
                          )}
                        >
                          {meta.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div
                  className={cn(
                    "mt-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                    TYPE_META[form.type].softClass
                  )}
                >
                  {TYPE_META[form.type].description}
                </div>
              </div>

              <div>
                <FieldLabel>Tiêu đề</FieldLabel>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  maxLength={255}
                  placeholder="Ví dụ: Lịch học mới đã được cập nhật"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <FieldLabel>Nội dung</FieldLabel>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  rows={7}
                  maxLength={2000}
                  placeholder="Nhập nội dung thông báo gửi cho người dùng..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                <div className="mt-2 text-right text-xs font-medium text-slate-400">
                  {form.message.length}/2000
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </form>

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
        </section>
      </main>
    </>
  );
}
