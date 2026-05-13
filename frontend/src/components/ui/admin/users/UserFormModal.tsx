"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, LockKeyhole, X } from "lucide-react";
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

function filterSelectableRoles(list: string[], options: string[]) {
  const normalized = normalizeList(list);
  if (!options.length) return normalized;

  const allowed = new Set(options.map((role) => role.toLowerCase()));
  return normalized.filter((role) => allowed.has(role.toLowerCase()));
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
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<string[]>(() =>
    filterSelectableRoles(initial?.roles ?? (initial?.role ? [initial.role] : []), options)
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
      roles: filterSelectableRoles(roles, options),
      active,
    };

    if (isEdit && password.trim()) payload.password = password.trim();

    // Nếu bạn muốn CHỈ cho submit role nằm trong options, bật đoạn này:
    // if (options.length) payload.roles = payload.roles?.filter((r) => options.includes(r));

    onSubmit(payload);
  };

  return (
    <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {isEdit ? "Cập nhật người dùng" : "Thêm người dùng"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isEdit
              ? "Chỉnh sửa thông tin, vai trò và trạng thái tài khoản."
              : "Tạo tài khoản mới và gán vai trò hệ thống."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
              Thông tin người dùng
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Họ và tên <span className="text-rose-600">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className={isEdit ? "" : "md:col-span-2"}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Số điện thoại
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0987654321"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {isEdit ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Đổi mật khẩu
                  </label>
                  <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-sky-500 dark:border-white/10 dark:bg-slate-950">
                    <div className="grid h-full w-11 place-items-center border-r border-slate-200 text-slate-400 dark:border-white/10">
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      disabled={saving}
                      className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={saving}
                      className="grid h-full w-11 place-items-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Bỏ trống nếu không muốn đổi mật khẩu.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                Vai trò hệ thống
              </h3>
              {!options.length ? (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Chưa có vai trò
                </span>
              ) : null}
            </div>

            {options.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {options.map((r) => {
                  const checked = roles.includes(r);

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      disabled={saving}
                      className={[
                        "flex min-h-11 items-center gap-3 rounded-xl border px-3 text-left transition disabled:opacity-60",
                        checked
                          ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-200"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                          checked
                            ? "border-sky-600 bg-sky-600"
                            : "border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {checked ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                      </span>
                      <span className="truncate text-sm font-semibold">{r}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  Trạng thái tài khoản
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {active ? "Tài khoản đang hoạt động" : "Tài khoản đang bị khóa"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActive((value) => !value)}
                disabled={saving}
                className={[
                  "relative h-8 w-14 rounded-full transition disabled:opacity-60",
                  active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700",
                ].join(" ")}
                aria-label="Đổi trạng thái tài khoản"
              >
                <span
                  className={[
                    "absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow transition",
                    active ? "left-7" : "left-1",
                  ].join(" ")}
                />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Đóng
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo người dùng"}
        </button>
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ModalBody key={String(formKey)} {...props} />

      {/* (Optional) nút ẩn cho a11y */}
      <button type="button" onClick={onClose} disabled={saving} className="sr-only" aria-hidden="true" />
    </div>
  );
}
