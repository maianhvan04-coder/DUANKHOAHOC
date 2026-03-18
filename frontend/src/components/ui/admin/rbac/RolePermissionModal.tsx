"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
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
      onClose();
    } catch (error) {
      console.error(error);
      alert("Lưu phân quyền thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/25">
      <div className="mx-auto mt-6 flex max-h-[94vh] w-[min(980px,96vw)] flex-col overflow-hidden rounded-[8px] border border-slate-300 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[12px] font-semibold text-slate-900">
                Manage Permissions
              </h2>
              <span className="rounded-[4px] border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-sky-700">
                {role.code}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Chọn permissions cho role này
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            {groups.map((group) => {
              const keys = group.items.map((item) => item.key);

              return (
                <div
                  key={group.groupKey}
                  className="rounded-[4px] border border-slate-300"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[11px] font-semibold text-slate-800">
                      {group.groupLabel}
                    </div>

                    <button
                      type="button"
                      onClick={() => clearGroup(keys)}
                      className="text-[10px] text-slate-500 hover:text-slate-700"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
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
                            <span className="truncate text-[10.5px] text-slate-700">
                              {item.label}
                            </span>
                          </label>

                          <select
                            disabled
                            defaultValue="ALL"
                            className={cn(
                              "h-5 min-w-[54px] rounded border border-slate-300 bg-white px-1.5 text-[9px] text-slate-500 outline-none"
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

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <div className="text-[11px] text-slate-500">
            Đã chọn <span className="font-semibold text-slate-900">{selected.length}</span>{" "}
            quyền
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-8 rounded-[6px] border border-slate-300 px-3 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-sky-600 px-3 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
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