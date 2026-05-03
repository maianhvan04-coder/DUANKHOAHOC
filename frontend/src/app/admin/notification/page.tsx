"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Search,
  Send,
  UsersRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminNotificationApi,
  type NotificationRecipientItem,
  type NotificationType,
} from "@/app/api/notification.api";
import { emitNotificationChanged } from "@/lib/utils/notification-events";

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
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200",
    softClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  },
  SUCCESS: {
    label: "Thành công",
    description: "Xác nhận thao tác hoặc trạng thái tích cực.",
    icon: CheckCircle2,
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
    softClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  WARNING: {
    label: "Cảnh báo",
    description: "Nhắc người dùng cần chú ý hoặc xử lý.",
    icon: AlertTriangle,
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
    softClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  },
  ERROR: {
    label: "Lỗi",
    description: "Thông báo sự cố hoặc thao tác thất bại.",
    icon: XCircle,
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200",
    softClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
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

function getInitials(name?: string, email?: string) {
  const source = (name || email || "ND").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
      {children}
    </label>
  );
}

function formatUserOption(user: NotificationRecipientItem) {
  const role = user.role ? ` (${user.role})` : "";
  return `${user.name || user.email} - ${user.email}${role}`;
}

export default function AdminNotificationPage() {
  const [users, setUsers] = useState<NotificationRecipientItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState<NotificationFormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);

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

  const PreviewIcon = TYPE_META[form.type].icon;

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

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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

      emitNotificationChanged();
      toast.success(result.message || "Đã gửi thông báo thành công");
      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
      }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gửi thông báo thất bại"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>

      <main className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200">
                <Bell className="h-4 w-4" />
                Gửi thông báo thủ công
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Trang này chỉ giữ lại chức năng tạo thông báo mới. Lịch sử thông
                báo đã gửi được chuyển sang nhóm `KIỂM TRA`, còn biểu tượng chuông trên
                thanh trên cùng dùng để xem thông báo bạn nhận được.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loadingUsers}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <UsersRound className="h-4 w-4" />
              {loadingUsers ? "Đang tải người dùng..." : "Tải lại người dùng"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Tìm người nhận</FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Tên, email hoặc vai trò"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-white/10"
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
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-white/10"
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
              </div>
            </div>

            <div>
              <FieldLabel>Loại thông báo</FieldLabel>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
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
                          ? "border-slate-900 bg-slate-950 text-white shadow-sm dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-black">
                        <Icon className="h-4 w-4" />
                        {type}
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-xs leading-5",
                          active
                            ? "text-slate-200 dark:text-sky-100/80"
                            : "text-slate-500 dark:text-slate-400"
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
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-white/10"
              />
            </div>

            <div>
              <FieldLabel>Nội dung</FieldLabel>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                rows={8}
                maxLength={2000}
                placeholder="Nhập nội dung thông báo gửi cho người dùng..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-white/10"
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
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">
              Người nhận đã chọn
            </h2>

            {selectedUser ? (
              <div className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                  {getInitials(selectedUser.name, selectedUser.email)}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-black text-slate-950 dark:text-slate-100">
                    {selectedUser.name || "Người dùng"}
                  </div>
                  <div className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {selectedUser.email}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {selectedUser.role || "USER"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Chưa chọn người nhận thông báo.
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">
                Xem trước thông báo
              </h2>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 p-4 dark:border-white/10">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                  TYPE_META[form.type].badgeClass
                )}
              >
                <PreviewIcon className="h-3.5 w-3.5" />
                {TYPE_META[form.type].label}
              </div>

              <h3 className="mt-4 text-xl font-black leading-tight text-slate-950 dark:text-slate-100">
                {form.title.trim() || "Tiêu đề thông báo"}
              </h3>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                {form.message.trim() ||
                  "Nội dung xem trước sẽ hiển thị ở đây khi bạn bắt đầu soạn thông báo."}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              Sau khi gửi, người nhận sẽ thấy thông báo này ở trang thông báo cá
              nhân và trên biểu tượng chuông nếu thông báo vẫn chưa đọc.
            </div>
          </section>
        </aside>
      </main>
    </>
  );
}
