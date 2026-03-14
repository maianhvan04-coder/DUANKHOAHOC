"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { userApi, type UserRow } from "@/app/api/user.api";
import UserFormModal, { type UserFormInitial } from "@/components/ui/admin/users/UserFormModal";

type ApiErrorBody = { message?: string };

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type TabKey = "USERS" | "DELETED";
type FormRole = UserFormInitial["role"];

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

/** ====== icons ====== */
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 20v-1a4 4 0 0 0-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
    </svg>
  );
}
function IconRestore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 3-6.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v6h6" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
    </svg>
  );
}
function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
    </svg>
  );
}
function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
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
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}
function Avatar({ name, seed }: { name: string; seed: string }) {
  const initials = getInitials(name);
  const hue = hashToHue(seed || name || "seed");
  const bg = `hsl(${hue} 85% 55%)`;
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: bg }}>
      {initials}
    </div>
  );
}

/** pills */
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
        const data = await userApi.list({ deleted: t === "DELETED" });
        setItems(data.map(normalizeUser));
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
    [tab]
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

  /** filter */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((u) => {
      const okSearch = !s ? true : [u.name, u.email, u.roles.join(" ")].some((v) => v.toLowerCase().includes(s));
      const okRole = roleFilter === "ALL" ? true : u.roles.includes(roleFilter);
      const okStatus = statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? u.active : !u.active;
      return okSearch && okRole && okStatus;
    });
  }, [items, q, roleFilter, statusFilter]);

  const foundCount = filtered.length;

  /** select all (filtered only) */
  const allSelected = useMemo(() => {
    return filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  }, [filtered, selected]);

  const selectedCount = selected.size;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (filtered.length === 0) return next;

      const every = filtered.every((u) => next.has(u.id));
      if (every) {
        for (const u of filtered) next.delete(u.id);
      } else {
        for (const u of filtered) next.add(u.id);
      }
      return next;
    });
  }, [filtered]);

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

  const cardCls =
    "rounded-2xl border px-6 shadow-sm " +
    "border-slate-200 bg-white " +
    "dark:border-white/10 dark:bg-slate-950/40 dark:shadow-[0_16px_50px_rgba(0,0,0,0.35)]";

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className={cn(cardCls, "py-5")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">User Management</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit and manage users.</p>

              {/* Tabs */}
              <div className="mt-4 inline-flex rounded-full border p-1 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setTab("USERS")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                    tab === "USERS"
                      ? "bg-emerald-200/70 text-slate-900 dark:bg-emerald-400/15 dark:text-emerald-100"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  <IconUsers className="h-4 w-4" />
                  Users
                </button>

                <button
                  type="button"
                  onClick={() => setTab("DELETED")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                    tab === "DELETED"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                  )}
                >
                  <IconTrash className="h-4 w-4" />
                  Deleted
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCreate}
                disabled={tab === "DELETED"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
                  "bg-emerald-900 text-white hover:bg-emerald-950",
                  "dark:bg-emerald-500/20 dark:text-emerald-50 dark:hover:bg-emerald-500/30 dark:ring-1 dark:ring-emerald-400/20"
                )}
              >
                <IconPlus className="h-4 w-4" />
                New User
              </button>

              <button
                type="button"
                onClick={() => load(tab)}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] disabled:opacity-60",
                  "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  "dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                )}
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={cn(cardCls, "py-4")}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div className={cn("flex items-center gap-2 rounded-full border px-4 py-2", "border-slate-200 bg-white", "dark:border-white/10 dark:bg-slate-950/60")}>
                <IconSearch className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  className={cn(
                    "w-[320px] max-w-[75vw] bg-transparent text-sm outline-none",
                    "text-slate-900 placeholder:text-slate-400",
                    "dark:text-slate-100 dark:placeholder:text-slate-500"
                  )}
                  placeholder="Search name, email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-semibold outline-none",
                  "border-slate-200 bg-white text-slate-700",
                  "dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                )}
              >
                <option value="ALL">All Roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-semibold outline-none",
                  "border-slate-200 bg-white text-slate-700",
                  "dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                )}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Found badge */}
            <div className={cn("inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-extrabold", "bg-slate-100 text-slate-800", "dark:bg-white/10 dark:text-slate-200")}>
              {foundCount} FOUND
            </div>
          </div>
        </div>

        {/* Bulk bar */}
        {selectedCount > 0 ? (
          <div className={cn("rounded-2xl border px-5 py-4", "border-slate-200 bg-white", "dark:border-white/10 dark:bg-slate-950/40")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Selected: <span className="font-extrabold">{selectedCount}</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                {tab === "DELETED" ? (
                  <button
                    type="button"
                    onClick={onBulkRestore}
                    className={cn(
                      "h-10 rounded-full px-4 text-sm font-extrabold transition",
                      "bg-emerald-900 text-white hover:bg-emerald-950",
                      "dark:bg-emerald-400/20 dark:text-emerald-50 dark:hover:bg-emerald-400/30 dark:ring-1 dark:ring-emerald-400/20"
                    )}
                  >
                    Restore selected
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={clearSelected}
                  className={cn(
                    "h-10 rounded-full border px-4 text-sm font-extrabold transition",
                    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  )}
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onBulkDelete}
                  className={cn("h-10 rounded-full px-4 text-sm font-extrabold transition", "bg-rose-600 text-white hover:bg-rose-700")}
                >
                  {tab === "DELETED" ? "Delete permanently" : "Move to Deleted"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div
          className={cn(
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
                ) : filtered.length === 0 ? (
                  <tr className="border-t border-slate-200 dark:border-white/10">
                    <td className="px-4 py-6 text-slate-500 dark:text-slate-400" colSpan={6}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
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
                              <IconEdit className="h-4 w-4" />
                            </IconBtn>

                            {tab === "DELETED" ? (
                              <IconBtn title="Restore" onClick={() => onRestore(u.id)}>
                                <IconRestore className="h-4 w-4" />
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
                              <IconTrash className="h-4 w-4" />
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

          {/* Footer pagination (UI giữ nguyên) */}
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-slate-200 dark:border-white/10">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">1–{Math.min(5, foundCount)}</span> of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">{foundCount}</span>
              <span className="ml-3">Rows</span>
              <select className="ml-2 h-9 rounded-full border px-3 text-sm font-semibold outline-none border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100">
                <option>5</option>
                <option>10</option>
                <option>25</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border transition border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                ‹
              </button>

              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold transition bg-emerald-900 text-white dark:bg-emerald-400/20 dark:text-emerald-50 dark:ring-1 dark:ring-emerald-400/20"
              >
                1
              </button>

              {["2", "3"].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  {n}
                </button>
              ))}

              <span className="px-1 text-slate-400 dark:text-slate-500">…</span>

              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                5
              </button>

              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border transition border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                ›
              </button>

              <div className="ml-3 flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Jump</span>
                <input
                  defaultValue={1}
                  className="h-9 w-24 rounded-full border px-4 text-sm font-semibold outline-none border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                />
                <button
                  type="button"
                  className="h-9 rounded-full px-4 text-sm font-extrabold transition bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                >
                  Go
                </button>
              </div>
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