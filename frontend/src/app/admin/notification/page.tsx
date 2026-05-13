"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Info,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminNotificationApi,
  type NotificationItem,
  type NotificationRecipientItem,
  type NotificationType,
  type NotificationUserItem,
} from "@/app/api/notification.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import { emitNotificationChanged } from "@/lib/utils/notification-events";
import type { SortDirection } from "@/lib/utils/admin-list";
import { toastConfirm } from "@/lib/utils/toast-confirm";

type NotificationSortKey =
  | "createdAt"
  | "title"
  | "type"
  | "isSent"
  | "sentAt";

type NotificationFormState = {
  title: string;
  message: string;
  type: NotificationType;
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
    label: "Khen thưởng",
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

const EMPTY_FORM: NotificationFormState = {
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

function getNotificationUserId(
  value: string | NotificationUserItem | null | undefined
) {
  return isUserObject(value) ? value._id : value || "";
}

function isNotificationSent(item: NotificationItem) {
  return item.isSent ?? true;
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium",
        meta.badgeClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function UserCell({
  value,
}: {
  value: string | NotificationUserItem | null | undefined;
}) {
  const name = getUserName(value);
  const email = getUserEmail(value);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-100">
        {getInitials(name, email)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">
          {name}
        </div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {email}
        </div>
      </div>
    </div>
  );
}

export default function AdminNotificationPage() {
  const [users, setUsers] = useState<NotificationRecipientItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | NotificationType>("");
  const [sentFilter, setSentFilter] = useState<"" | "true" | "false">("");
  const [sortKey, setSortKey] = useState<NotificationSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const [form, setForm] = useState<NotificationFormState>(EMPTY_FORM);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);
  const recipientRef = useRef<HTMLDivElement | null>(null);

  const activeUsers = useMemo(
    () => users.filter((user) => user.active !== false),
    [users]
  );

  const filteredRecipients = useMemo(() => {
    const keyword = recipientSearch.trim().toLowerCase();
    if (!keyword) return activeUsers;

    return activeUsers.filter((user) =>
      `${user.name} ${user.email} ${user.role || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [activeUsers, recipientSearch]);

  const activeFilterCount = [typeFilter, sentFilter].filter(Boolean).length;

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const result = await adminNotificationApi.getRecipients({ limit: 500 });
      setUsers(result.data.items);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được danh sách người dùng"));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoadingItems(true);
      const result = await adminNotificationApi.getAll({
        page,
        limit: pageSize,
        keyword: search.trim() || undefined,
        type: typeFilter || undefined,
        isSent: sentFilter || undefined,
        sortBy: sortKey,
        sortOrder: sortDirection,
      });

      const data = result.data;
      const pagination = data.pagination ?? {
        page,
        limit: pageSize,
        total: 0,
        totalPages: 1,
      };

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(pagination.total || 0);
      setTotalPages(Math.max(pagination.totalPages || 1, 1));
    } catch (error: unknown) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      toast.error(getErrorMessage(error, "Không tải được thông báo"));
    } finally {
      setLoadingItems(false);
    }
  }, [page, pageSize, search, sentFilter, sortDirection, sortKey, typeFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, refreshKey]);

  useEffect(() => {
    if (!recipientOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!recipientRef.current) return;
      if (!recipientRef.current.contains(event.target as Node)) {
        setRecipientOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [recipientOpen]);

  const handleRemove = useCallback(
    async (item: NotificationItem) => {
      const ok = await toastConfirm(`Xóa thông báo "${item.title}"?`);
      if (!ok) return;

      try {
        setDeletingId(item._id);
        await adminNotificationApi.remove(item._id);
        emitNotificationChanged();
        toast.success("Đã xóa thông báo");

        if (items.length === 1 && page > 1) {
          setPage((prev) => Math.max(1, prev - 1));
        } else {
          setRefreshKey((prev) => prev + 1);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Xóa thông báo thất bại"));
      } finally {
        setDeletingId(null);
      }
    },
    [items.length, page]
  );

  const handleSend = useCallback(async (item: NotificationItem) => {
    const ok = await toastConfirm(`Gửi thông báo "${item.title}"?`);
    if (!ok) return;

    try {
      setSendingId(item._id);
      await adminNotificationApi.send(item._id);
      emitNotificationChanged();
      toast.success("Đã gửi thông báo");
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gửi thông báo thất bại"));
    } finally {
      setSendingId(null);
    }
  }, []);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "type",
        title: "Loại thông báo",
        options: TYPE_OPTIONS.map((type) => ({
          id: type,
          label: TYPE_META[type].label,
          checked: typeFilter === type,
          onToggle: () => {
            setPage(1);
            setTypeFilter((prev) => (prev === type ? "" : type));
          },
        })),
      },
      {
        id: "status",
        title: "Trạng thái",
        options: [
          {
            id: "unread",
            label: "Chưa gửi",
            checked: sentFilter === "false",
            onToggle: () => {
              setPage(1);
              setSentFilter((prev) => (prev === "false" ? "" : "false"));
            },
          },
          {
            id: "read",
            label: "Đã gửi",
            checked: sentFilter === "true",
            onToggle: () => {
              setPage(1);
              setSentFilter((prev) => (prev === "true" ? "" : "true"));
            },
          },
        ],
      },
    ],
    [sentFilter, typeFilter]
  );

  const openEditModal = useCallback((item: NotificationItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      message: item.message,
      type: item.type,
    });
    setSelectedUserIds([getNotificationUserId(item.userId)].filter(Boolean));
    setRecipientSearch("");
    setRecipientOpen(false);
    setModalOpen(true);
  }, []);

  const columns = useMemo<
    AdminTableColumn<NotificationItem, NotificationSortKey>[]
  >(
    () => [
      {
        id: "type",
        label: "Loại",
        sortKey: "type",
        widthClassName: "w-[135px]",
        render: (item) => <TypeBadge type={item.type} />,
      },
      {
        id: "title",
        label: "Tiêu đề",
        sortKey: "title",
        widthClassName: "w-[250px]",
        render: (item) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">
              {item.title}
            </div>
            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {item.message}
            </div>
          </div>
        ),
      },
      {
        id: "user",
        label: "Người dùng",
        widthClassName: "w-[220px]",
        render: (item) => <UserCell value={item.userId} />,
      },
      {
        id: "status",
        label: "Trạng thái",
        sortKey: "isSent",
        widthClassName: "w-[130px]",
        render: (item) => (
          <AdminStatusBadge tone={isNotificationSent(item) ? "success" : "warning"}>
            {isNotificationSent(item) ? "Đã gửi" : "Chưa gửi"}
          </AdminStatusBadge>
        ),
      },
      {
        id: "updated",
        label: "Cập nhật",
        sortKey: "createdAt",
        widthClassName: "w-[155px]",
        cellClassName: "whitespace-nowrap",
        render: (item) => (
          <span className="text-sm font-medium">
            {formatDate(item.updatedAt || item.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        label: "Hành động",
        widthClassName: "w-[148px]",
        cellClassName: "whitespace-nowrap",
        align: "right",
        render: (item) => {
          const sent = isNotificationSent(item);

          return (
            <div className="flex items-center justify-end gap-1">
              <AdminActionIconButton title="Xem" onClick={() => setDetailItem(item)}>
                <Eye className="h-4 w-4" />
              </AdminActionIconButton>

              {!sent ? (
                <>
                  <AdminActionIconButton title="Sửa" onClick={() => openEditModal(item)}>
                    <Pencil className="h-4 w-4" />
                  </AdminActionIconButton>
                  <AdminActionIconButton
                    danger
                    title="Xóa"
                    disabled={deletingId === item._id}
                    onClick={() => void handleRemove(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminActionIconButton>
                  <AdminActionIconButton
                    title="Gửi"
                    disabled={sendingId === item._id}
                    onClick={() => void handleSend(item)}
                  >
                    <Send className="h-4 w-4 text-emerald-500" />
                  </AdminActionIconButton>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [deletingId, handleRemove, handleSend, openEditModal, sendingId]
  );

  function resetForm() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setSelectedUserIds([]);
    setRecipientSearch("");
    setRecipientOpen(false);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function closeCreateModal() {
    if (submitting) return;
    setModalOpen(false);
    resetForm();
  }

  function toggleRecipient(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((item) => item !== userId)
        : [...prev, userId]
    );
  }

  function toggleAllRecipients() {
    const ids = activeUsers.map((user) => user._id);
    setSelectedUserIds((prev) => (prev.length === ids.length ? [] : ids));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề");
      return;
    }

    if (!form.message.trim()) {
      toast.warning("Vui lòng nhập nội dung");
      return;
    }

    if (!editingItem && selectedUserIds.length === 0) {
      toast.warning("Vui lòng chọn người nhận");
      return;
    }

    try {
      setSubmitting(true);

      if (editingItem) {
        await adminNotificationApi.update(editingItem._id, {
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
        });
        toast.success("Đã cập nhật thông báo");
      } else {
        for (const userId of selectedUserIds) {
          await adminNotificationApi.create({
            userId,
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
          });
        }
        toast.success(`Đã lưu ${selectedUserIds.length} thông báo`);
      }

      emitNotificationChanged();
      closeCreateModal();
      setPage(1);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lưu thông báo thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLabel =
    editingItem
      ? getUserName(editingItem.userId)
      : selectedUserIds.length === 0
        ? "Chọn người nhận..."
        : selectedUserIds.length === activeUsers.length
          ? "Tất cả người dùng"
          : `${selectedUserIds.length} người nhận`;

  return (
    <main className="space-y-5">
      <AdminListTable<NotificationItem, NotificationSortKey>
        rows={items}
        columns={columns}
        rowKey={(item) => item._id}
        loading={loadingItems}
        searchValue={search}
        searchPlaceholder="Tìm theo tiêu đề, nội dung, người nhận..."
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setTypeFilter("");
          setSentFilter("");
          setPage(1);
        }}
        sortBy={sortKey}
        sortOrder={sortDirection}
        onSortChange={(nextSortBy, nextSortOrder) => {
          setSortKey(nextSortBy);
          setSortDirection(nextSortOrder);
          setPage(1);
        }}
        onReload={() => setRefreshKey((prev) => prev + 1)}
        toolbarEnd={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Thêm thông báo
          </button>
        }
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
        emptyText="Chưa có thông báo phù hợp"
        labels={{
          apply: "Áp dụng",
          clear: "Xóa lọc",
          filter: "Lọc",
          loading: "Đang tải thông báo...",
          noData: "Không có dữ liệu",
          of: "trên",
          reload: "Làm mới",
          rows: "Dòng",
          search: "Tìm kiếm",
          showing: "Hiển thị",
        }}
        tableMinWidthClassName="min-w-full"
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                {editingItem ? "Sửa thông báo" : "Thêm thông báo"}
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tiêu đề *
                  </label>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Tiêu đề"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Loại *
                  </label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        type: event.target.value as NotificationType,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_META[type].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div ref={recipientRef} className="relative">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Người nhận *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingItem) setRecipientOpen((prev) => !prev);
                    }}
                    disabled={loadingUsers}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <span className="truncate">
                      {loadingUsers ? "Đang tải người nhận..." : selectedLabel}
                    </span>
                    {!editingItem ? (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition",
                          recipientOpen && "rotate-180"
                        )}
                      />
                    ) : null}
                  </button>

                  {recipientOpen && !editingItem ? (
                    <div className="absolute right-0 top-[76px] z-30 w-full min-w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
                      <div className="border-b border-slate-200 p-3 dark:border-white/10">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={recipientSearch}
                            onChange={(event) =>
                              setRecipientSearch(event.target.value)
                            }
                            placeholder="Tìm theo tên hoặc email..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-200 dark:divide-white/10">
                        <button
                          type="button"
                          onClick={toggleAllRecipients}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/10"
                        >
                          <span
                            className={cn(
                              "grid h-4 w-4 shrink-0 place-items-center rounded border",
                              selectedUserIds.length === activeUsers.length &&
                                activeUsers.length > 0
                                ? "border-sky-600 bg-sky-600"
                                : "border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900"
                            )}
                          >
                            {selectedUserIds.length === activeUsers.length &&
                            activeUsers.length > 0 ? (
                              <Check className="h-3 w-3 text-white" />
                            ) : null}
                          </span>
                          <span className="font-medium text-slate-950 dark:text-white">
                            Tất cả
                          </span>
                        </button>

                        {loadingUsers ? (
                          <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Đang tải người nhận...
                          </div>
                        ) : filteredRecipients.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Không tìm thấy người nhận
                          </div>
                        ) : (
                          filteredRecipients.map((user) => {
                            const checked = selectedUserIds.includes(user._id);

                            return (
                              <button
                                key={user._id}
                                type="button"
                                onClick={() => toggleRecipient(user._id)}
                                className={cn(
                                  "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                                  checked
                                    ? "bg-sky-50/80 dark:bg-sky-500/10"
                                    : "hover:bg-slate-50 dark:hover:bg-white/10"
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid h-4 w-4 shrink-0 place-items-center rounded border",
                                    checked
                                      ? "border-sky-600 bg-sky-600"
                                      : "border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900"
                                  )}
                                >
                                  {checked ? (
                                    <Check className="h-3 w-3 text-white" />
                                  ) : null}
                                </span>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-slate-100 text-sm font-medium text-slate-700 dark:bg-slate-200 dark:text-slate-800">
                                  {getInitials(user.name, user.email)}
                                </div>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-base font-medium leading-5 text-slate-950 dark:text-white">
                                    {user.name || user.email}
                                  </span>
                                  <span className="mt-1 block truncate text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">
                                    {user.email}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="border-t border-slate-200 p-3 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setRecipientOpen(false)}
                          className="h-10 w-full rounded-xl bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-700"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nội dung *
                </label>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  rows={11}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="mt-2 text-right text-xs font-semibold text-slate-400">
                  {form.message.length}/2000
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {detailItem ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                Chi tiết thông báo
              </h2>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <TypeBadge type={detailItem.type} />
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Tiêu đề
                </div>
                <div className="mt-1 text-lg font-medium text-slate-950 dark:text-white">
                  {detailItem.title}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Nội dung
                </div>
                <div className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  {detailItem.message}
                </div>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    Người nhận
                  </div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-white">
                    {getUserName(detailItem.userId)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    Cập nhật
                  </div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-white">
                    {formatDate(detailItem.updatedAt || detailItem.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
