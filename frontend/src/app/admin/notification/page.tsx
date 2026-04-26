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
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  MailPlus,
  RefreshCw,
  Search,
  Send,
  Trash2,
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
  type NotificationUserItem,
} from "@/app/api/notification.api";

type ReadFilter = "" | "true" | "false";

type NotificationFilters = {
  userId: string;
  type: "" | NotificationType;
  isRead: ReadFilter;
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

function isUserObject(
  value: string | NotificationUserItem | null | undefined
): value is NotificationUserItem {
  return typeof value === "object" && value !== null;
}

function getUserId(value: string | NotificationUserItem | null | undefined) {
  return typeof value === "string" ? value : value?._id ?? "";
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
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
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
  return (
    <label className="mb-2 block text-sm font-bold text-slate-700">
      {children}
    </label>
  );
}

function NotificationBadge({ type }: { type: NotificationType }) {
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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const [form, setForm] = useState<NotificationFormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterUserId, setFilterUserId] = useState("");
  const [filterType, setFilterType] = useState<"" | NotificationType>("");
  const [filterRead, setFilterRead] = useState<ReadFilter>("");
  const [query, setQuery] = useState<NotificationFilters>({
    userId: "",
    type: "",
    isRead: "",
  });

  const selectedUser = useMemo(
    () => users.find((user) => user._id === form.userId) ?? null,
    [form.userId, users]
  );

  const filteredUserOptions = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    const activeUsers = users.filter((user) => user.active !== false);
    const matches = keyword
      ? activeUsers.filter((user) =>
          `${user.name} ${user.email} ${user.role}`
            .toLowerCase()
            .includes(keyword)
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được danh sách người dùng"));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadNotifications = useCallback(
    async (nextPage: number, nextQuery: NotificationFilters) => {
      try {
        setLoadingItems(true);
        setError("");

        const result = await adminNotificationApi.getAll({
          page: nextPage,
          limit: 10,
          userId: nextQuery.userId || undefined,
          type: nextQuery.type || undefined,
          isRead: nextQuery.isRead || undefined,
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
      } catch (error: unknown) {
        setItems([]);
        setPage(1);
        setTotal(0);
        setTotalPages(1);
        setError(getErrorMessage(error, "Không tải được danh sách thông báo"));
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
    void loadNotifications(1, query);
  }, [loadNotifications, query]);

  function applyFilters() {
    setQuery({
      userId: filterUserId,
      type: filterType,
      isRead: filterRead,
    });
  }

  function resetFilters() {
    setFilterUserId("");
    setFilterType("");
    setFilterRead("");
    setQuery({
      userId: "",
      type: "",
      isRead: "",
    });
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

      await loadNotifications(1, query);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gửi thông báo thất bại"));
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
      await loadNotifications(nextPage, query);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa thông báo thất bại"));
    } finally {
      setDeletingId(null);
    }
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <>
      <Toaster richColors position="top-right" />

      <main className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                <Bell className="h-4 w-4" />
                Trung tâm thông báo
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Gửi thông báo cho người dùng
              </h1>

              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                Tạo thông báo từ admin, gửi đến từng tài khoản và theo dõi trạng
                thái đã đọc ngay trên cùng một màn hình.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => void loadNotifications(page, query)}
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

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Tạo thông báo mới
              </h2>
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

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Lịch sử thông báo
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Lọc theo người nhận, loại thông báo hoặc trạng thái đọc.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                Trang <span className="font-black text-slate-950">{page}</span> /{" "}
                {totalPages}
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px_auto_auto]">
              <select
                value={filterUserId}
                onChange={(event) => setFilterUserId(event.target.value)}
                className="h-12 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="">Tất cả người nhận</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {formatUserOption(user)}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(event) =>
                  setFilterType(event.target.value as "" | NotificationType)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="">Tất cả loại</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={filterRead}
                onChange={(event) => setFilterRead(event.target.value as ReadFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="false">Chưa đọc</option>
                <option value="true">Đã đọc</option>
              </select>

              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <Filter className="h-4 w-4" />
                Lọc
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            {loadingItems ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[26px] border border-slate-200 p-4"
                  >
                    <div className="animate-pulse">
                      <div className="h-5 w-1/2 rounded-xl bg-slate-100" />
                      <div className="mt-3 h-4 w-3/4 rounded-xl bg-slate-100" />
                      <div className="mt-4 h-10 w-full rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                  <Bell className="h-7 w-7" />
                </div>
                <div className="mt-5 text-xl font-black text-slate-900">
                  Chưa có thông báo phù hợp
                </div>
                <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Hãy gửi thông báo mới hoặc thay đổi bộ lọc để xem lịch sử đã
                  tạo.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const userName = getUserName(item.userId);
                  const userEmail = getUserEmail(item.userId);
                  const createdByName = getUserName(item.createdBy);
                  const userId = getUserId(item.userId);

                  return (
                    <article
                      key={item._id}
                      className="rounded-[26px] border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <NotificationBadge type={item.type} />
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                                item.isRead
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              )}
                            >
                              {item.isRead ? "Đã đọc" : "Chưa đọc"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-black leading-tight text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {item.message}
                          </p>

                          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3">
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
                              <div className="mt-1 truncate text-[11px] text-slate-400">
                                ID: {userId || "-"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-3 lg:w-[230px]">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                              Tạo lúc
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900">
                              {formatDate(item.createdAt)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                              Người tạo
                            </div>
                            <div className="mt-1 truncate text-sm font-bold text-slate-900">
                              {createdByName}
                            </div>
                          </div>

                          {item.readAt ? (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                                Đọc lúc
                              </div>
                              <div className="mt-1 text-sm font-bold text-emerald-900">
                                {formatDate(item.readAt)}
                              </div>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => void handleRemove(item)}
                            disabled={deletingId === item._id}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === item._id ? "Đang xóa..." : "Xóa"}
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
                disabled={!hasPrev || loadingItems}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Trang trước
              </button>

              <div className="text-center text-sm font-semibold text-slate-500">
                Hiển thị <span className="text-slate-950">{items.length}</span> /{" "}
                <span className="text-slate-950">{total}</span> thông báo
              </div>

              <button
                type="button"
                onClick={() => hasNext && loadNotifications(page + 1, query)}
                disabled={!hasNext || loadingItems}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
