"use client";

import { useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
  Loader2,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import RolePermissionModal from "@/components/ui/admin/rbac/RolePermissionModal";
import {
  rbacApi,
  type PermissionKey,
  type PermissionMetaItem,
  type RoleItem,
} from "@/app/api/rbac.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function roleTheme(code: string) {
  const c = code.toUpperCase();

  if (c === "ADMIN") {
    return {
      row: "bg-[#f5f0ff]",
      iconWrap: "bg-[#ede3ff]",
      iconColor: "text-[#7c3aed]",
      badge: "border-[#a78bfa] text-[#7c3aed] bg-[#faf5ff]",
    };
  }

  if (c === "MANAGER") {
    return {
      row: "bg-[#fff7ed]",
      iconWrap: "bg-[#ffedd5]",
      iconColor: "text-[#ea580c]",
      badge: "border-[#fdba74] text-[#ea580c] bg-[#fff7ed]",
    };
  }

  if (c === "TEACHER") {
    return {
      row: "bg-[#ecfdf5]",
      iconWrap: "bg-[#d1fae5]",
      iconColor: "text-[#059669]",
      badge: "border-[#6ee7b7] text-[#059669] bg-[#f0fdf4]",
    };
  }

  if (c === "STUDENT") {
    return {
      row: "bg-[#eff6ff]",
      iconWrap: "bg-[#dbeafe]",
      iconColor: "text-[#2563eb]",
      badge: "border-[#93c5fd] text-[#2563eb] bg-[#eff6ff]",
    };
  }

  if (c === "USER") {
    return {
      row: "bg-[#f8fafc]",
      iconWrap: "bg-[#e2e8f0]",
      iconColor: "text-[#475569]",
      badge: "border-[#94a3b8] text-[#475569] bg-[#f8fafc]",
    };
  }

  return {
    row: "bg-white",
    iconWrap: "bg-[#f1f5f9]",
    iconColor: "text-[#64748b]",
    badge: "border-[#cbd5e1] text-[#64748b] bg-[#f8fafc]",
  };
}

function getDescription(role: RoleItem) {
  return role.description?.trim() || "No description provided";
}

function getDisplayName(role: RoleItem) {
  return role.name?.trim() || role.code;
}

function normalizeCode(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function isSystemRole(code: string) {
  return ["ADMIN", "MANAGER", "TEACHER", "STUDENT", "USER"].includes(
    code.toUpperCase()
  );
}

function getUserCount(role: RoleItem) {
  const raw = role as RoleItem & {
    userCount?: number;
    memberCount?: number;
    totalUsers?: number;
  };

  return Number(raw.userCount ?? raw.memberCount ?? raw.totalUsers ?? 0);
}

const ROLE_RANK: Record<string, number> = {
  ADMIN: 1,
  MANAGER: 2,
  TEACHER: 3,
  STUDENT: 4,
  USER: 5,
};

type RoleFormMode = "create" | "edit";

type RoleFormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

const EMPTY_FORM: RoleFormState = {
  code: "",
  name: "",
  description: "",
  isActive: true,
};

function RoleFormModal({
  open,
  mode,
  initialValue,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: RoleFormMode;
  initialValue: RoleFormState;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<RoleFormState>(initialValue);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await onSubmit({
      ...form,
      code: normalizeCode(form.code),
      name: form.name.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[560px] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {mode === "create" ? "Thêm role" : "Sửa role"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "Tạo vai trò mới cho hệ thống"
                : "Cập nhật thông tin vai trò"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mã role
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                disabled={mode === "edit"}
                placeholder="VD: CONTENT_MANAGER"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tên hiển thị
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="VD: Content Manager"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mô tả
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Nhập mô tả role"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">Kích hoạt role</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Tạo role" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRbacPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissionMeta, setPermissionMeta] = useState<PermissionMetaItem[]>([]);
  const [rolePermissionMap, setRolePermissionMap] = useState<
    Record<string, PermissionKey[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [openPermissionModal, setOpenPermissionModal] = useState(false);
  const [activePermissionRole, setActivePermissionRole] =
    useState<RoleItem | null>(null);

  const [openRoleForm, setOpenRoleForm] = useState(false);
  const [roleFormMode, setRoleFormMode] = useState<RoleFormMode>("create");
  const [activeEditRole, setActiveEditRole] = useState<RoleItem | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  async function loadAll(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [catalog, roleList] = await Promise.all([
        rbacApi.getCatalog(),
        rbacApi.getRoles(),
      ]);

      setPermissionMeta(catalog.permissionMeta || []);
      setRoles(roleList || []);

      const permissionPairs = await Promise.all(
        (roleList || []).map(async (role) => {
          try {
            const res = await rbacApi.getRolePermissions(role.code);
            return [role.code, res.permissionKeys] as const;
          } catch {
            return [
              role.code,
              catalog.defaultRolePermissions?.[role.code] || [],
            ] as const;
          }
        })
      );

      setRolePermissionMap(Object.fromEntries(permissionPairs));
    } catch (error) {
      console.error(error);
      alert("Không tải được dữ liệu RBAC");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      const rankA = ROLE_RANK[a.code.toUpperCase()] ?? 100;
      const rankB = ROLE_RANK[b.code.toUpperCase()] ?? 100;

      if (rankA !== rankB) return rankA - rankB;

      const priorityA = a.priority ?? 9999;
      const priorityB = b.priority ?? 9999;

      if (priorityA !== priorityB) return priorityA - priorityB;

      return getDisplayName(a).localeCompare(getDisplayName(b));
    });
  }, [roles]);

  function getPermissionPreview(roleCode: string) {
    const keys = rolePermissionMap[roleCode] || [];
    return {
      list: keys.slice(0, 2),
      remain: Math.max(0, keys.length - 2),
      total: keys.length,
    };
  }

  function handleOpenPermission(role: RoleItem) {
    setActivePermissionRole(role);
    setOpenPermissionModal(true);
  }

  function handleSavedPermissions(
    roleCode: string,
    permissionKeys: PermissionKey[]
  ) {
    setRolePermissionMap((prev) => ({
      ...prev,
      [roleCode]: permissionKeys,
    }));
  }

  function handleOpenCreate() {
    setRoleFormMode("create");
    setActiveEditRole(null);
    setOpenRoleForm(true);
  }

  function handleOpenEdit(role: RoleItem) {
    setRoleFormMode("edit");
    setActiveEditRole(role);
    setOpenRoleForm(true);
  }

  async function handleSubmitRole(values: RoleFormState) {
    if (!values.code.trim()) {
      alert("Vui lòng nhập mã role");
      return;
    }

    if (!values.name.trim()) {
      alert("Vui lòng nhập tên role");
      return;
    }

    try {
      setSavingRole(true);

      if (roleFormMode === "create") {
        await rbacApi.createRole({
          code: values.code,
          name: values.name,
          description: values.description,
          isActive: values.isActive,
        });
      } else {
        await rbacApi.updateRole(activeEditRole?.code || values.code, {
          name: values.name,
          description: values.description,
          isActive: values.isActive,
        });
      }

      setOpenRoleForm(false);
      setActiveEditRole(null);
      await loadAll(true);
    } catch (error) {
      console.error(error);
      alert(
        roleFormMode === "create"
          ? "Tạo role thất bại"
          : "Cập nhật role thất bại"
      );
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDelete(role: RoleItem) {
    if (isSystemRole(role.code)) {
      alert("Không được xóa role hệ thống");
      return;
    }

    const ok = window.confirm(
      `Bạn có chắc muốn xóa role "${role.code}" không?`
    );
    if (!ok) return;

    try {
      setDeletingCode(role.code);
      await rbacApi.deleteRole(role.code);

      setRoles((prev) => prev.filter((item) => item.code !== role.code));
      setRolePermissionMap((prev) => {
        const next = { ...prev };
        delete next[role.code];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert("Xóa role thất bại");
    } finally {
      setDeletingCode(null);
    }
  }

  const roleFormInitialValue: RoleFormState = activeEditRole
    ? {
      code: activeEditRole.code,
      name: activeEditRole.name || activeEditRole.code,
      description: activeEditRole.description || "",
      isActive: activeEditRole.isActive !== false,
    }
    : EMPTY_FORM;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f9fc]">
        <div className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <Loader2 size={16} className="animate-spin" />
          Đang tải phân quyền...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f7f9fc] px-6 py-5">
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-4 flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
            <div className="hidden">
              <h1 className="text-[22px] font-bold text-slate-900">
                Role & Permissions
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Quản lý vai trò và phân quyền hệ thống
              </p>
            </div>

            <div className="ml-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void loadAll(true)}
                className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw
                  size={14}
                  className={cn(refreshing && "animate-spin")}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-slate-900 px-3 text-[12px] font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={14} />
                Thêm role
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-slate-300 bg-white">
            {sortedRoles.map((role) => {
              const theme = roleTheme(role.code);
              const preview = getPermissionPreview(role.code);
              const deleting = deletingCode === role.code;

              return (
                <div
                  key={role._id}
                  className={cn(
                    "grid min-h-[102px] grid-cols-[90px_360px_1fr_150px_90px_150px] items-center border-b border-slate-200 px-5",
                    theme.row
                  )}
                >
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        "flex h-[58px] w-[58px] items-center justify-center rounded-[18px]",
                        theme.iconWrap
                      )}
                    >
                      <ShieldCheck
                        size={32}
                        className={theme.iconColor}
                        strokeWidth={2.35}
                      />
                    </div>
                  </div>

                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] font-bold leading-none text-slate-900">
                        {getDisplayName(role)}
                      </h3>

                      <span
                        className={cn(
                          "rounded-[6px] border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          theme.badge
                        )}
                      >
                        {role.code}
                      </span>
                    </div>

                    <div className="mt-3 text-[13px] text-slate-500">
                      {getDescription(role)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pr-4">
                    {preview.total > 0 ? (
                      <>
                        {preview.list.map((item) => (
                          <span
                            key={item}
                            className="rounded-[8px] bg-white/75 px-3 py-2 text-[12px] font-semibold text-slate-800 shadow-sm"
                          >
                            {item}
                          </span>
                        ))}

                        {preview.remain > 0 && (
                          <span className="rounded-[8px] bg-white/80 px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm">
                            +{preview.remain}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[13px] text-slate-400">
                        No permissions
                      </span>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "rounded-full px-4 py-1 text-[13px] font-bold",
                        role.isActive === false
                          ? "bg-rose-100 text-rose-700"
                          : "bg-[#bde9be] text-[#176b2d]"
                      )}
                    >
                      {role.isActive === false ? "INACTIVE" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[14px] font-bold text-slate-800">
                      {getUserCount(role)}
                    </span>
                    <Users
                      size={15}
                      className="text-slate-400"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleOpenPermission(role)}
                      className="text-[#7c4ed8] transition hover:scale-105"
                      title="Permissions"
                    >
                      <KeyRound size={18} strokeWidth={1.9} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(role)}
                      className="text-[#3b82f6] transition hover:scale-105"
                      title="Edit"
                    >
                      <Pencil size={18} strokeWidth={1.9} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(role)}
                      disabled={deleting}
                      className="text-[#ef4444] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} strokeWidth={1.9} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedRoles.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Không có role nào
              </div>
            )}
          </div>
        </div>
      </div>

      <RolePermissionModal
        open={openPermissionModal}
        role={activePermissionRole}
        permissionMeta={permissionMeta}
        initialSelected={
          activePermissionRole
            ? rolePermissionMap[activePermissionRole.code] || []
            : []
        }
        onClose={() => {
          setOpenPermissionModal(false);
          setActivePermissionRole(null);
        }}
        onSaved={handleSavedPermissions}
      />

      <RoleFormModal
        key={`${roleFormMode}-${activeEditRole?.code ?? "new"}-${openRoleForm ? "open" : "close"
          }`}
        open={openRoleForm}
        mode={roleFormMode}
        initialValue={roleFormInitialValue}
        saving={savingRole}
        onClose={() => {
          setOpenRoleForm(false);
          setActiveEditRole(null);
        }}
        onSubmit={handleSubmitRole}
      />
    </>
  );
}