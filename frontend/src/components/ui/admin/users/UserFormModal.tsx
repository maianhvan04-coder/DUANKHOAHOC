"use client";

import { useMemo, useState } from "react";
import type { UserRow } from "@/app/api/user.api";

export type UserFormInitial = UserRow & {
  phone?: string;
  active?: boolean;
  roles?: string[];
  role?: string; // nếu BE còn role đơn (fallback)
};

type Props = {
  open: boolean;
  initial: UserFormInitial | null;
  saving: boolean;
  roleOptions: string[];
  onClose: () => void;
  onSubmit: (data: Partial<UserFormInitial> & { password?: string; roles?: string[] }) => void;
};

function normalizeList(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of list ?? []) {
    const v = String(r ?? "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function ModalBody({
  initial,
  saving,
  roleOptions,
  onClose,
  onSubmit,
}: Pick<Props, "initial" | "saving" | "roleOptions" | "onClose" | "onSubmit">) {
  const isEdit = !!initial;

  const options = useMemo(() => normalizeList(roleOptions ?? []), [roleOptions]);

  // ✅ init state 1 lần khi component mount (nhờ key remount)
  const [name, setName] = useState(() => initial?.name ?? "");
  const [email, setEmail] = useState(() => initial?.email ?? "");
  const [phone, setPhone] = useState(() => initial?.phone ?? "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>(() =>
    normalizeList(initial?.roles ?? (initial?.role ? [initial.role] : []))
  );
  const [active, setActive] = useState(() => initial?.active ?? true);

  const toggleRole = (r: string) => {
    if (saving) return;
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : normalizeList([...prev, r])));
  };

  const submit = () => {
    const payload: Partial<UserFormInitial> & { password?: string; roles?: string[] } = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      roles: normalizeList(roles),
      active,
    };

    if (isEdit && password.trim()) payload.password = password.trim();

    // Nếu bạn muốn CHỈ cho submit role nằm trong options, bật đoạn này:
    // if (options.length) payload.roles = payload.roles?.filter((r) => options.includes(r));

    onSubmit(payload);
  };

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="text-[15px] font-bold text-black/85">
          {isEdit ? "Update Profile" : "Create Account"}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="grid h-8 w-8 place-items-center rounded-lg text-black/60 hover:bg-black/5 disabled:opacity-60"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="p-5">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-[13px] font-bold text-blue-600">Thông tin người dùng</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-black/70">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="h-10 w-full rounded-lg border border-black/10 px-3 text-[13px] outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-black/70">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                className="h-10 w-full rounded-lg border border-black/10 px-3 text-[13px] outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-[12px] font-semibold text-black/70">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0987654321"
                disabled={saving}
                className="h-10 w-full rounded-lg border border-black/10 px-3 text-[13px] outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            {isEdit && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-black/70">
                    Đổi mật khẩu (tuỳ chọn)
                  </label>
                  <span className="text-[12px] text-black/35">ⓘ</span>
                </div>

                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-black/10">
                  <div className="grid h-full w-10 place-items-center border-r border-black/10 text-black/50">
                    🔒
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    disabled={saving}
                    className="h-full w-full px-3 text-[13px] outline-none disabled:opacity-60"
                  />
                  <div className="grid h-full w-10 place-items-center border-l border-black/10 text-black/40">
                    👁
                  </div>
                </div>

                <div className="text-[11px] text-black/45">
                  Nếu nhập mật khẩu mới, hệ thống sẽ cập nhật mật khẩu cho user.
                </div>
              </div>
            )}
          </div>

          {/* Roles */}
          <div className="mt-4 border-t border-black/10 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-black/70">Vai trò hệ thống</div>
              <div className="text-[11px] text-black/40">{options.length ? "" : "Chưa có role"}</div>
            </div>

            {options.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {options.map((r) => {
                  const checked = roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      disabled={saving}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition",
                        checked ? "border-blue-500 bg-blue-50" : "border-black/10 bg-white hover:bg-black/5",
                        saving ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-4 w-4 place-items-center rounded border transition",
                          checked ? "border-blue-500 bg-blue-600" : "border-black/20 bg-white",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className={checked ? "opacity-100" : "opacity-0"}
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <span className="text-[12px] font-bold text-black/80">{r}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mt-4 border-t border-black/10 pt-4">
            <div className="text-[12px] font-semibold text-black/70">Trạng thái tài khoản</div>

            <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-[12px] font-bold text-emerald-900">
                {active ? "Tài khoản đang hoạt động" : "Tài khoản bị khoá"}
              </div>

              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                disabled={saving}
                className={[
                  "relative h-6 w-10 rounded-full transition",
                  active ? "bg-emerald-500" : "bg-black/25",
                  saving ? "opacity-60" : "",
                ].join(" ")}
                aria-label="Toggle active"
              >
                <span
                  className={[
                    "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition",
                    active ? "left-5" : "left-1",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-black/10 bg-white px-4 py-2 text-[12px] font-bold text-black/70 hover:bg-black/5 disabled:opacity-60"
            >
              Huỷ
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo người dùng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserFormModal(props: Props) {
  const { open, initial, saving, onClose } = props;

  if (!open) return null;

  // ✅ key remount khi đổi user / chuyển create-edit
  // ✅ chuẩn backend: dùng id (không dùng _id)
  const formKey = initial?.id ?? initial?.email ?? "create";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <ModalBody key={String(formKey)} {...props} />

      {/* (Optional) nút ẩn cho a11y */}
      <button type="button" onClick={onClose} disabled={saving} className="sr-only" aria-hidden="true" />
    </div>
  );
}