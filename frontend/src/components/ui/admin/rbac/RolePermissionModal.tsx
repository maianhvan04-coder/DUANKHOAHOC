"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  PermissionKey,
  PermissionMetaItem,
  RoleItem,
} from "@/app/api/rbac.api";
import { rbacApi } from "@/app/api/rbac.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type GroupBlock = {
  groupKey: string;
  groupLabel: string;
  items: PermissionMetaItem[];
  order: number;
};

type Props = {
  open: boolean;
  role: RoleItem | null;
  permissionMeta: PermissionMetaItem[];
  initialSelected: PermissionKey[];
  onClose: () => void;
  onSaved: (roleCode: string, permissionKeys: PermissionKey[]) => void;
};

export default function RolePermissionModal({
  open,
  role,
  permissionMeta,
  initialSelected,
  onClose,
  onSaved,
}: Props) {
  const [selected, setSelected] = useState<PermissionKey[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected || []);
    }
  }, [open, initialSelected]);

  const groups = useMemo<GroupBlock[]>(() => {
    const map = new Map<string, GroupBlock>();

    for (const item of permissionMeta) {
      const current = map.get(item.groupKey);
      if (current) {
        current.items.push(item);
        current.order = Math.min(current.order, item.order ?? 99999);
      } else {
        map.set(item.groupKey, {
          groupKey: item.groupKey,
          groupLabel: item.groupLabel,
          items: [item],
          order: item.order ?? 99999,
        });
      }
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) => (a.order ?? 99999) - (b.order ?? 99999)
        ),
      }))
      .sort((a, b) => a.order - b.order);
  }, [permissionMeta]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function togglePermission(key: PermissionKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }

  function clearGroup(keys: PermissionKey[]) {
    setSelected((prev) => prev.filter((x) => !keys.includes(x)));
  }

  async function handleSave() {
    if (!role) return;

    try {
      setSaving(true);

      const orderedKeys = permissionMeta
        .map((item) => item.key)
        .filter((key) => selected.includes(key));

      const res = await rbacApi.setRolePermissions(role.code, orderedKeys);

      onSaved(role.code, res.permissionKeys);
      toast.success("Lưu phân quyền thành công");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Lưu phân quyền thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                Manage Permissions
              </h2>
              <span className="rounded-[4px] border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                {role.code}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Chọn quyền cho vai trò này
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {groups.map((group) => {
              const keys = group.items.map((item) => item.key);

              return (
                <div
                  key={group.groupKey}
                  className="rounded-[4px] border border-slate-300 dark:border-white/10"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                      {group.groupLabel}
                    </div>

                    <button
                      type="button"
                      onClick={() => clearGroup(keys)}
                      className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {group.items.map((item) => {
                      const checked = selectedSet.has(item.key);

                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3 px-3 py-1.5"
                        >
                          <label className="flex min-w-0 cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(item.key)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="truncate text-[10.5px] text-slate-700 dark:text-slate-200">
                              {item.label}
                            </span>
                          </label>

                          <select
                            disabled
                            defaultValue="ALL"
                            className={cn(
                              "h-5 min-w-[54px] rounded border border-slate-300 bg-white px-1.5 text-[9px] text-slate-500 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
                            )}
                          >
                            <option value="ALL">ALL</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Đã chọn <span className="font-semibold text-slate-900 dark:text-slate-100">{selected.length}</span>{" "}
            quyền
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
