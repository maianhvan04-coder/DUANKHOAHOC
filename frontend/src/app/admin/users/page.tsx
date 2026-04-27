"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Lock,
  LockOpen,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { userApi, type UserRow } from "@/app/api/user.api";
import UserFormModal, { type UserFormInitial } from "@/components/ui/admin/users/UserFormModal";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  makePaginationMeta,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/utils/admin-list";

type ApiErrorBody = { message?: string };

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type TabKey = "USERS" | "DELETED";
type FormRole = UserFormInitial["role"];
type UserSortKey = "name" | "email" | "role" | "status" | "createdAt";

/** ===== UI ViewModel (NO any) ===== */
type UserVM = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt?: string;
  deleted: boolean;
};

function isFormRole(v: string): v is FormRole {
  return v === "USER" || v === "ADMIN";
}

function toFormRole(input?: string): FormRole {
  const s = String(input ?? "").trim().toUpperCase();
  return isFormRole(s) ? s : "USER";
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** ====== safe readers (NO any) ====== */
function getObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}
function pickString(obj: unknown, key: string): string | undefined {
  const o = getObj(obj);
  if (!o) return undefined;
  const v = o[key];
  return typeof v === "string" ? v : undefined;
}
function pickBoolean(obj: unknown, key: string): boolean | undefined {
  const o = getObj(obj);
  if (!o) return undefined;
  const v = o[key];
  return typeof v === "boolean" ? v : undefined;
}
function pickStringArray(obj: unknown, key: string): string[] | undefined {
  const o = getObj(obj);
  if (!o) return undefined;
  const v = o[key];
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const it of v) if (typeof it === "string") out.push(it);
  return out;
}

/** normalize từ UserRow => UserVM */
function normalizeUser(row: UserRow): UserVM {
  const raw: unknown = row;

  const id = pickString(raw, "id") ?? "";
  const name = pickString(raw, "name") ?? "";
  const email = pickString(raw, "email") ?? "";

  const rolesFromArray = pickStringArray(raw, "roles");
  const rolesFromString = pickString(raw, "roles");
  const roleSingle = pickString(raw, "role");

  const roles = (
    rolesFromArray && rolesFromArray.length
      ? rolesFromArray
      : rolesFromString
        ? [rolesFromString]
        : roleSingle
          ? [roleSingle]
          : []
  )
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0);

  const active = pickBoolean(raw, "active") ?? true;
  const createdAt = pickString(raw, "createdAt");

  const deletedAt = pickString(raw, "deletedAt");
  const isDeleted = pickBoolean(raw, "isDeleted") ?? false;
  const deleted = isDeleted || (typeof deletedAt === "string" && deletedAt.length > 0);

  return { id, name, email, roles, active, createdAt, deleted };
}

function formatCreated(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function getInitials(name?: string) {
  const s = String(name ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function hashToHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function Avatar({ name, seed }: { name: string; seed: string }) {
  const initials = getInitials(name);
  const hue = hashToHue(seed || name || "seed");
  const bg = `hsl(${hue} 85% 55%)`;
  return (
    <div
      className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-white"
      style={{ background: bg }}
    >
      {initials}
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        "bg-emerald-100 text-emerald-800 ring-emerald-200",
        "dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20"
      )}
    >
      {role}
    </span>
  );
}

function StatusPill({
  active,
  clickable,
  loading,
  onClick,
}: {
  active: boolean;
  clickable: boolean;
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!clickable || loading}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 transition",
        active
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20"
          : "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20",
        clickable ? "hover:brightness-95 active:scale-[0.99]" : "cursor-default",
        loading ? "opacity-60" : ""
      )}
      title={
        clickable
          ? active
            ? "Click để chuyển INACTIVE"
            : "Click để chuyển ACTIVE"
          : undefined
      }
    >
      {loading ? "..." : active ? "ACTIVE" : "INACTIVE"}
    </button>
  );
}

function IconBtn({
  title,
  onClick,
  className,
  children,
  disabled,
}: {
  title: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg border transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function UsersPage() {
  const [items, setItems] = useState<UserVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("USERS");

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<UserSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [serverPagination, setServerPagination] = useState<PaginationMeta>(
    makePaginationMeta(0, 1, 10)
  );

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<UserFormInitial | null>(null);
  const [saving, setSaving] = useState(false);

  /** bulk selection */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /** per-row status loading */
  const [statusBusy, setStatusBusy] = useState<Set<string>>(new Set());

  const clearSelected = useCallback(() => setSelected(new Set()), []);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const load = useCallback(
    async (t: TabKey = tab) => {
      setLoading(true);
      setErr(null);
      try {
        const data = await userApi.list({
          deleted: t === "DELETED",
          q,
          role: roleFilter,
          status: statusFilter,
          sortBy: sortKey,
          sortOrder: sortDirection,
          page,
          limit: rowsPerPage,
        });
        setItems(data.items.map(normalizeUser));
        setServerPagination(data.pagination);
      } catch (error: unknown) {
        if (axios.isAxiosError<ApiErrorBody>(error)) {
          setErr(error.response?.data?.message || error.message || "Load users failed");
        } else if (error instanceof Error) {
          setErr(error.message || "Load users failed");
        } else {
          setErr("Load users failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [page, q, roleFilter, rowsPerPage, sortDirection, sortKey, statusFilter, tab]
  );

  useEffect(() => {
    clearSelected();
    void load(tab);
  }, [tab, load, clearSelected]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const u of items) for (const r of u.roles) set.add(r);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const onCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (u: UserVM) => {
    const rolePrimary = toFormRole(u.roles[0]); // ✅ now "USER" | "ADMIN"

    const mapped: UserFormInitial = {
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active,
      phone: "",
      createdAt: u.createdAt,
      role: rolePrimary,      // ✅ hết lỗi
      roles: u.roles,         // (giữ nguyên nếu UserFormInitial.roles là string[])
    };

    setEditing(mapped);
    setOpenForm(true);
  };
  /** toggle status (only USERS tab) */
  const onToggleStatus = async (u: UserVM) => {
    if (tab !== "USERS") return;

    const nextActive = !u.active;
    const msg = nextActive ? "Chuyển sang ACTIVE?" : "Chuyển sang INACTIVE?";
    if (!confirm(msg)) return;

    try {
      setStatusBusy((prev) => new Set(prev).add(u.id));
      await userApi.setActive(u.id, nextActive);

      // update local for snappy UI
      setItems((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, active: nextActive } : x))
      );
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Đổi trạng thái thất bại");
      else alert("Đổi trạng thái thất bại");
    } finally {
      setStatusBusy((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
    }
  };

  /** USERS -> soft delete | DELETED -> hard delete */
  const onDelete = async (id: string) => {
    const hard = tab === "DELETED";
    const msg = hard ? "Xoá vĩnh viễn user này?" : "Chuyển user này vào Deleted? (sẽ INACTIVE)";
    if (!confirm(msg)) return;

    try {
      if (hard) await userApi.hardRemove(id);
      else await userApi.remove(id);

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await load(tab);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Xoá thất bại");
      else alert("Xoá thất bại");
    }
  };

  const onRestore = async (id: string) => {
    if (!confirm("Khôi phục user này? (sẽ ACTIVE)")) return;
    try {
      await userApi.restore(id);

      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await load(tab);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Restore thất bại");
      else alert("Restore thất bại");
    }
  };

  const onSubmit = async (data: Partial<UserFormInitial> & { password?: string; roles?: string[] }) => {
    try {
      setSaving(true);

      if (editing) await userApi.update(editing.id, data);
      else await userApi.create(data);

      setOpenForm(false);
      setEditing(null);
      await load(tab);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Lưu thất bại");
      else alert("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const paged = items;
  const totalPages = serverPagination.totalPages;
  const currentPage = serverPagination.page;
  const foundCount = serverPagination.total;
  const from = foundCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to = Math.min(currentPage * rowsPerPage, foundCount);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /** select all (current page) */
  const allSelected = useMemo(() => {
    return paged.length > 0 && paged.every((u) => selected.has(u.id));
  }, [paged, selected]);

  const selectedCount = selected.size;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (paged.length === 0) return next;

      const every = paged.every((u) => next.has(u.id));
      if (every) {
        for (const u of paged) next.delete(u.id);
      } else {
        for (const u of paged) next.add(u.id);
      }
      return next;
    });
  }, [paged]);

  const bulkChunk = async (ids: string[], fn: (id: string) => Promise<void>) => {
    const chunkSize = 8;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await Promise.all(chunk.map((id) => fn(id)));
    }
  };

  const onBulkDelete = async () => {
    if (selected.size === 0) return;

    const hard = tab === "DELETED";
    const msg = hard
      ? `Xoá vĩnh viễn ${selected.size} user đã chọn?`
      : `Chuyển ${selected.size} user vào Deleted? (sẽ INACTIVE)`;
    if (!confirm(msg)) return;

    try {
      const ids = Array.from(selected);
      await bulkChunk(ids, (id) => (hard ? userApi.hardRemove(id) : userApi.remove(id)));

      clearSelected();
      await load(tab);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Xoá nhiều thất bại");
      else alert("Xoá nhiều thất bại");
    }
  };

  const onBulkRestore = async () => {
    if (tab !== "DELETED" || selected.size === 0) return;
    if (!confirm(`Khôi phục ${selected.size} user đã chọn? (sẽ ACTIVE)`)) return;

    try {
      const ids = Array.from(selected);
      await bulkChunk(ids, (id) => userApi.restore(id));

      clearSelected();
      await load(tab);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorBody>(error)) alert(error.response?.data?.message || "Restore nhiều thất bại");
      else alert("Restore nhiều thất bại");
    }
  };

  const activeFilterCount =
    (roleFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "role",
        title: "Role",
        options: [
          {
            id: "role-all",
            label: "All Roles",
            checked: roleFilter === "ALL",
            onToggle: () => {
              setRoleFilter("ALL");
              setPage(1);
            },
          },
          ...roleOptions.map((role) => ({
            id: `role-${role}`,
            label: role,
            checked: roleFilter === role,
            onToggle: () => {
              setRoleFilter(role);
              setPage(1);
            },
          })),
        ],
      },
      {
        id: "status",
        title: "Status",
        options: [
          {
            id: "status-all",
            label: "All Status",
            checked: statusFilter === "ALL",
            onToggle: () => {
              setStatusFilter("ALL");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "ACTIVE",
            checked: statusFilter === "ACTIVE",
            onToggle: () => {
              setStatusFilter("ACTIVE");
              setPage(1);
            },
          },
          {
            id: "status-inactive",
            label: "INACTIVE",
            checked: statusFilter === "INACTIVE",
            onToggle: () => {
              setStatusFilter("INACTIVE");
              setPage(1);
            },
          },
        ],
      },
    ],
    [roleFilter, roleOptions, statusFilter]
  );

  const tableColumns: AdminTableColumn<UserVM, UserSortKey>[] = [
      {
        id: "select",
        label: (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-slate-300"
          />
        ),
        widthClassName: "w-[56px]",
        render: (u) => (
          <input
            type="checkbox"
            checked={selected.has(u.id)}
            onChange={() => toggleOne(u.id)}
            className="h-4 w-4 rounded border-slate-300"
          />
        ),
      },
      {
        id: "user",
        label: "User",
        sortKey: "name",
        widthClassName: "w-[320px]",
        render: (u) => (
          <AdminEntityCell
            title={u.name || "--"}
            subtitle={u.email || "--"}
            fallback={getInitials(u.name)}
          />
        ),
      },
      {
        id: "roles",
        label: "Roles",
        sortKey: "role",
        widthClassName: "w-[180px]",
        render: (u) =>
          u.roles.length ? (
            <div className="flex flex-wrap gap-2">
              {u.roles.map((role) => (
                <AdminStatusBadge
                  key={role}
                  tone="neutral"
                  className="min-w-[72px]"
                >
                  {role}
                </AdminStatusBadge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400">No roles</span>
          ),
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        widthClassName: "w-[140px]",
        render: (u) => {
          const label =
            tab === "DELETED" ? "DELETED" : u.active ? "ACTIVE" : "INACTIVE";

          return (
            <AdminStatusBadge tone={label === "ACTIVE" ? "success" : "danger"}>
              {statusBusy.has(u.id) ? "..." : label}
            </AdminStatusBadge>
          );
        },
      },
      {
        id: "created",
        label: "Created",
        sortKey: "createdAt",
        widthClassName: "w-[150px]",
        render: (u) => formatCreated(u.createdAt),
      },
      {
        id: "actions",
        label: <div className="text-right">Actions</div>,
        widthClassName: "w-[150px]",
        align: "right",
        render: (u) => (
          <div className="flex items-center justify-end gap-2">
            {tab === "USERS" ? (
              <>
                <AdminActionIconButton title="Edit" onClick={() => onEdit(u)}>
                  <Pencil className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  title={u.active ? "Lock" : "Unlock"}
                  disabled={statusBusy.has(u.id)}
                  onClick={() => void onToggleStatus(u)}
                >
                  {u.active ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <LockOpen className="h-4 w-4" />
                  )}
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Move to Deleted"
                  onClick={() => void onDelete(u.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminActionIconButton>
              </>
            ) : (
              <>
                <AdminActionIconButton
                  title="Restore"
                  onClick={() => void onRestore(u.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Delete permanently"
                  onClick={() => void onDelete(u.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminActionIconButton>
              </>
            )}
          </div>
        ),
      },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <section className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTab("USERS");
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                    tab === "USERS"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-slate-700 hover:bg-white"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Users
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("DELETED");
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                    tab === "DELETED"
                      ? "bg-rose-100 text-rose-700"
                      : "text-slate-700 hover:bg-white"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Deleted
                </button>
              </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCreate}
                disabled={tab === "DELETED"}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-[18px] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                <Plus className="h-4.5 w-4.5" />
                New User
              </button>

              <button
                type="button"
                onClick={() => void load(tab)}
                disabled={loading}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-[18px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                <RefreshCw className={cn("h-4.5 w-4.5", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Bulk bar */}
        {selectedCount > 0 ? (
          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                Selected: <span className="font-extrabold">{selectedCount}</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                {tab === "DELETED" ? (
                  <button
                    type="button"
                    onClick={onBulkRestore}
                    className="h-10 rounded-[16px] bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Restore selected
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={clearSelected}
                  className="h-10 rounded-[16px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onBulkDelete}
                  className="h-10 rounded-[16px] bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  {tab === "DELETED" ? "Delete permanently" : "Move to Deleted"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <AdminListTable<UserVM, UserSortKey>
          rows={paged}
          columns={tableColumns}
          rowKey={(item) => item.id}
          loading={loading}
          searchValue={q}
          searchPlaceholder="Search name, email..."
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          filterSections={filterSections}
          activeFilterCount={activeFilterCount}
          onApplyFilters={() => setPage(1)}
          onClearFilters={() => {
            setQ("");
            setRoleFilter("ALL");
            setStatusFilter("ALL");
            setPage(1);
          }}
          sortBy={sortKey}
          sortOrder={sortDirection}
          onSortChange={(nextSortBy, nextSortOrder) => {
            setSortKey(nextSortBy);
            setSortDirection(nextSortOrder);
            setPage(1);
          }}
          onReload={() => void load(tab)}
          pagination={{
            currentPage,
            totalPages,
            totalItems: foundCount,
            pageSize: rowsPerPage,
            onPageSizeChange: (nextPageSize) => {
              setRowsPerPage(nextPageSize);
              setPage(1);
            },
            onPageChange: setPage,
            pageSizeOptions: [5, 10, 20],
          }}
          emptyText={err || "Khong co du lieu"}
          tableMinWidthClassName="min-w-[1040px]"
        />

        {/* Table */}
        <div
          className={cn(
            "hidden",
            "overflow-hidden rounded-2xl border",
            "border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
            "dark:border-white/10 dark:bg-slate-950/40 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          )}
        >
          <div className="overflow-x-auto">
            <table className="min-w-275 w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr className="text-left">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 dark:border-white/20 dark:bg-transparent"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">USER</th>
                  <th className="px-4 py-3 font-semibold">ROLES</th>
                  <th className="px-4 py-3 font-semibold">STATUS</th>
                  <th className="px-4 py-3 font-semibold">CREATED</th>
                  <th className="px-4 py-3 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-200 dark:border-white/10">
                      <td className="px-4 py-4">
                        <div className="h-4 w-4 rounded bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-56 rounded bg-slate-100 animate-pulse dark:bg-white/10" />
                        <div className="mt-2 h-3 w-40 rounded bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-28 rounded-full bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-28 rounded bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="ml-auto h-9 w-24 rounded-lg bg-slate-100 animate-pulse dark:bg-white/10" />
                      </td>
                    </tr>
                  ))
                ) : err ? (
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="px-4 py-4 text-rose-600 dark:text-rose-300 font-semibold" colSpan={6}>
                      {err}
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="px-4 py-6 text-slate-500 dark:text-slate-400" colSpan={6}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  paged.map((u) => {
                    const busy = statusBusy.has(u.id);
                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-t transition",
                          "border-slate-200 hover:bg-slate-50",
                          "dark:border-white/10 dark:hover:bg-white/5"
                        )}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected.has(u.id)}
                            onChange={() => toggleOne(u.id)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-white/20 dark:bg-transparent"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} seed={u.email || u.id} />
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white">{u.name || "—"}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{u.email || "—"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {u.roles.length ? (
                            <div className="flex flex-wrap gap-2">
                              {u.roles.map((r) => (
                                <RolePill key={r} role={r} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">No roles</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusPill
                            active={u.active}
                            clickable={tab === "USERS"}
                            loading={busy}
                            onClick={() => onToggleStatus(u)}
                          />
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatCreated(u.createdAt)}</td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <IconBtn title="Edit" onClick={() => onEdit(u)} disabled={tab === "DELETED"}>
                              <Pencil className="h-4 w-4" />
                            </IconBtn>

                            {tab === "DELETED" ? (
                              <IconBtn title="Restore" onClick={() => onRestore(u.id)}>
                                <RotateCcw className="h-4 w-4" />
                              </IconBtn>
                            ) : null}

                            <IconBtn
                              title={tab === "DELETED" ? "Delete permanently" : "Move to Deleted"}
                              onClick={() => onDelete(u.id)}
                              className={cn(
                                "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700",
                                "dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15 dark:hover:text-rose-100"
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-slate-200 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">{from}-{to}</span> of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">{foundCount}</span>
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-full border px-3 text-sm font-semibold outline-none border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="grid h-9 w-9 place-items-center rounded-full border transition border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {"<"}
              </button>

              <div className="grid h-9 min-w-9 place-items-center rounded-full px-3 text-sm font-extrabold transition bg-emerald-900 text-white dark:bg-emerald-400/20 dark:text-emerald-50 dark:ring-1 dark:ring-emerald-400/20">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="grid h-9 w-9 place-items-center rounded-full border transition border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {openForm && (
        <UserFormModal
          key={editing?.id ?? "new"}
          open={openForm}
          initial={editing}
          saving={saving}
          roleOptions={roleOptions}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}
