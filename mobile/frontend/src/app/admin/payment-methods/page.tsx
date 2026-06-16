"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CreditCard,
  Edit3,
  Lock,
  LockOpen,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import {
  paymentMethodApi,
  type PaymentMethodItem,
  type PaymentMethodPayload,
  type PaymentMethodType,
} from "@/app/api/payment-method.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  getPageBounds,
  paginateItems,
  sortItems,
  type SortDirection,
} from "@/lib/utils/admin-list";
import { useAdminPreferences } from "@/i18n";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

type MethodForm = {
  name: string;
  code: string;
  type: PaymentMethodType;
  bankName: string;
  accountNumber: string;
  accountName: string;
  logo: string;
  qrImage: string;
  description: string;
  transferPrefix: string;
  sortOrder: string;
  isActive: boolean;
};

type PaymentMethodSortKey =
  | "name"
  | "type"
  | "bankName"
  | "status";

type PaymentMethodStatusFilter = "all" | "active" | "inactive";

const bankPresets = [
  {
    value: "MB",
    label: "MB",
    code: "MBB",
    methodName: "MB Bank",
    logo: "/banks/mbbank.png",
    description: "Ngan hang Quan doi, VietQR",
  },
  {
    value: "VietinBank",
    label: "VietinNgân hàng",
    code: "VTB",
    methodName: "VietinBank",
    logo: "/banks/vietinbank.png",
    description: "VietinBank, VietQR, Internet Banking",
  },
] as const;

const defaultBankPreset = bankPresets[0];

const emptyForm: MethodForm = {
  name: defaultBankPreset.methodName,
  code: defaultBankPreset.code,
  type: "BANK",
  bankName: defaultBankPreset.value,
  accountNumber: "",
  accountName: "",
  logo: defaultBankPreset.logo,
  qrImage: "",
  description: defaultBankPreset.description,
  transferPrefix: "EVR",
  sortOrder: "0",
  isActive: true,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiError;
    return (
      apiError.response?.data?.message ||
      apiError.response?.data?.error ||
      apiError.message ||
      fallback
    );
  }

  return fallback;
}

function getMethodInitial(method: PaymentMethodItem) {
  return (method.code || method.name || "PM").slice(0, 3).toUpperCase();
}

function typeLabel(type: PaymentMethodType) {
  if (type === "EWALLET") return "Ví điện tử";
  if (type === "CRYPTO") return "Tiền điện tử";
  return "Ngân hàng";
}

function toForm(item: PaymentMethodItem): MethodForm {
  return {
    name: item.name || "",
    code: item.code || "",
    type: item.type || "BANK",
    bankName: item.bankName || "",
    accountNumber: item.accountNumber || "",
    accountName: item.accountName || "",
    logo: item.logo || "",
    qrImage: item.qrImage || "",
    description: item.description || "",
    transferPrefix: item.transferPrefix || "EVR",
    sortOrder: String(item.sortOrder || 0),
    isActive: item.isActive !== false,
  };
}

function toPayload(form: MethodForm): PaymentMethodPayload {
  const fallbackCodeSource = form.code || form.bankName || form.name || "PM";
  const fallbackCode = fallbackCodeSource
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 6)
    .toUpperCase();

  return {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase() || fallbackCode || "PM",
    type: form.type,
    bankName: form.bankName.trim(),
    accountNumber: form.accountNumber.trim(),
    accountName: form.accountName.trim(),
    logo: form.logo.trim(),
    qrImage: form.qrImage.trim(),
    description: form.description.trim(),
    transferPrefix: form.transferPrefix.trim().toUpperCase() || "EVR",
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function MethodLogo({ method }: { method: PaymentMethodItem }) {
  if (method.logo) {
    return (
      <img
        src={method.logo}
        alt={method.name}
        className="h-12 w-12 rounded-2xl object-cover"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-sm font-black text-[#1677ff]">
      {getMethodInitial(method)}
    </span>
  );
}

export default function AdminPaymentMethodsPage() {
  const { theme } = useAdminTheme();
  const { t } = useAdminPreferences();
  const dark = theme === "dark";
  const [items, setItems] = useState<PaymentMethodItem[]>([]);
  const [form, setForm] = useState<MethodForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | PaymentMethodType>("all");
  const [statusFilter, setStatusFilter] =
    useState<PaymentMethodStatusFilter>("all");
  const [sortKey, setSortKey] = useState<PaymentMethodSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive !== false).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [
          item.name,
          item.code,
          item.bankName,
          item.accountNumber,
          item.accountName,
          item.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const active = item.isActive !== false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? active : !active);

      return matchesKeyword && matchesType && matchesStatus;
    });
  }, [items, search, statusFilter, typeFilter]);

  const sortedItems = useMemo(
    () =>
      sortItems(
        filteredItems,
        (item) => {
          if (sortKey === "type") return typeLabel(item.type);
          if (sortKey === "bankName") return item.bankName || item.name;
          if (sortKey === "status") return item.isActive !== false;
          return item.name || "";
        },
        sortDirection
      ),
    [filteredItems, sortDirection, sortKey]
  );

  const { totalPages, currentPage } = getPageBounds(
    sortedItems.length,
    page,
    rowsPerPage
  );

  const pagedItems = useMemo(
    () => paginateItems(sortedItems, currentPage, rowsPerPage),
    [currentPage, rowsPerPage, sortedItems]
  );

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const typeLabelMap: Record<PaymentMethodType, string> = {
    BANK: t("paymentMethods.type.bank"),
    EWALLET: t("paymentMethods.type.ewallet"),
    CRYPTO: t("paymentMethods.type.crypto"),
  };

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await paymentMethodApi.getAdminList();
      setItems(data.items || []);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải phương thức thanh toán."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function updateField<K extends keyof MethodForm>(key: K, value: MethodForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateType(value: PaymentMethodType) {
    setForm((prev) => {
      if (value !== "BANK") return { ...prev, type: value };

      const currentPreset = bankPresets.find(
        (preset) => preset.value === prev.bankName
      );
      const preset = currentPreset || defaultBankPreset;

      return {
        ...prev,
        type: "BANK",
        bankName: preset.value,
        name: preset.methodName,
        code: preset.code,
        logo: preset.logo,
        description: preset.description,
      };
    });
  }

  function updateBankPreset(value: string) {
    const preset = bankPresets.find((item) => item.value === value);

    if (!preset) {
      updateField("bankName", value);
      return;
    }

    setForm((prev) => ({
      ...prev,
      type: "BANK",
      bankName: preset.value,
      name: preset.methodName,
      code: preset.code,
      logo: preset.logo,
      description: preset.description,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setMessage("");
    setError("");
    setFormOpen(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId("");
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toPayload(form);
    if (!payload.name || !payload.code) {
      setError("Tên và mã phương thức là bắt buộc.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const nextMessage = editingId
        ? "Đã cập nhật phương thức thanh toán."
        : "Đã thêm phương thức thanh toán.";

      if (editingId) {
        await paymentMethodApi.update(editingId, payload);
      } else {
        await paymentMethodApi.create(payload);
      }

      resetForm();
      setMessage(nextMessage);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể lưu phương thức thanh toán."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: PaymentMethodItem) {
    try {
      setError("");
      await paymentMethodApi.update(item._id, {
        isActive: item.isActive === false,
      });
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể cập nhật trạng thái."));
    }
  }

  async function removeItem(item: PaymentMethodItem) {
    const ok = window.confirm(`Xóa phương thức "${item.name}"?`);
    if (!ok) return;

    try {
      setError("");
      await paymentMethodApi.remove(item._id);
      if (editingId === item._id) resetForm();
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa phương thức thanh toán."));
    }
  }

  function startEdit(item: PaymentMethodItem) {
    setEditingId(item._id);
    setForm(toForm(item));
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  const filterSections: AdminFilterSection[] = [
    {
      id: "type",
      title: t("paymentMethods.filter.type"),
      options: [
        { id: "type-all", label: t("dict.all"), checked: typeFilter === "all", onToggle: () => { setTypeFilter("all"); setPage(1); } },
        { id: "type-bank", label: t("paymentMethods.type.bank"), checked: typeFilter === "BANK", onToggle: () => { setTypeFilter("BANK"); setPage(1); } },
        { id: "type-ewallet", label: t("paymentMethods.type.ewallet"), checked: typeFilter === "EWALLET", onToggle: () => { setTypeFilter("EWALLET"); setPage(1); } },
        { id: "type-crypto", label: t("paymentMethods.type.crypto"), checked: typeFilter === "CRYPTO", onToggle: () => { setTypeFilter("CRYPTO"); setPage(1); } },
      ],
    },
    {
      id: "status",
      title: t("dict.status"),
      options: [
        { id: "status-all", label: t("dict.all"), checked: statusFilter === "all", onToggle: () => { setStatusFilter("all"); setPage(1); } },
        { id: "status-active", label: t("paymentMethods.status.active"), checked: statusFilter === "active", onToggle: () => { setStatusFilter("active"); setPage(1); } },
        { id: "status-inactive", label: t("paymentMethods.status.inactive"), checked: statusFilter === "inactive", onToggle: () => { setStatusFilter("inactive"); setPage(1); } },
      ],
    },
  ];

  const tableColumns: AdminTableColumn<
    PaymentMethodItem,
    PaymentMethodSortKey
  >[] = [
    {
      id: "method",
      label: t("paymentMethods.column.method"),
      sortKey: "name",
      widthClassName: "w-[310px]",
      render: (item) => (
        <AdminEntityCell
          title={item.name || "--"}
          subtitle={item.code || "--"}
          meta={item.description}
          image={item.logo}
          fallback={getMethodInitial(item)}
        />
      ),
    },
    {
      id: "type",
      label: t("dict.type"),
      sortKey: "type",
      widthClassName: "w-[150px]",
      render: (item) => typeLabelMap[item.type],
    },
    {
      id: "account",
      label: t("paymentMethods.column.account"),
      sortKey: "bankName",
      widthClassName: "w-[260px]",
      render: (item) => (
        <div className="min-w-0">
          <div className="truncate font-semibold">
            {item.bankName || item.name || "--"}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            STK: {item.accountNumber || "--"}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            Chu TK: {item.accountName || "--"}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      label: t("dict.status"),
      sortKey: "status",
      widthClassName: "w-[130px]",
      align: "center",
      render: (item) => (
        <AdminStatusBadge tone={item.isActive !== false ? "success" : "neutral"}>
          {item.isActive !== false
            ? t("paymentMethods.status.active")
            : t("paymentMethods.status.inactive")}
        </AdminStatusBadge>
      ),
    },
    {
      id: "actions",
      label: <div className="text-right">{t("dict.actions")}</div>,
      widthClassName: "w-[130px]",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <AdminActionIconButton title={t("dict.edit")} onClick={() => startEdit(item)}>
            <Edit3 className="h-4 w-4" />
          </AdminActionIconButton>
          <AdminActionIconButton
            title={
              item.isActive !== false
                ? t("paymentMethods.action.disable")
                : t("paymentMethods.action.enable")
            }
            onClick={() => void toggleActive(item)}
          >
            {item.isActive !== false ? (
              <Lock className="h-4 w-4" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
          </AdminActionIconButton>
          <AdminActionIconButton
            danger
            title={t("dict.delete")}
            onClick={() => void removeItem(item)}
          >
            <Trash2 className="h-4 w-4" />
          </AdminActionIconButton>
        </div>
      ),
    },
  ];

  const paymentModalFieldClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";
  const paymentModalLabelClass =
    "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <main
      className={cn(
        "min-h-full px-5 py-6 md:px-7",
        dark ? "bg-[#0b1120] text-white" : "bg-[#f5f7fb] text-slate-950"
      )}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className={cn(
            "hidden overflow-hidden rounded-[28px] border p-6 shadow-sm",
            dark
              ? "border-white/10 bg-[#111827]"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                className={cn(
                  "text-sm font-black uppercase tracking-[0.18em]",
                  dark ? "text-blue-300" : "text-[#1677ff]"
                )}
              >
                Payment Methods
              </p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">
                Quản lý phương thức thanh toán
              </h1>
              <p
                className={cn(
                  "mt-2 max-w-3xl text-sm leading-6",
                  dark ? "text-slate-400" : "text-slate-500"
                )}
              >
                Cấu hình nhiều ngân hàng, ví điện tử hoặc kênh chuyển khoản để
                học viên chọn khi nạp tiền vào ví.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadItems()}
              className={cn(
                "flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition",
                dark
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div
              className={cn(
                "rounded-2xl border p-4",
                dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200"
              )}
            >
              <p className="text-sm font-semibold text-slate-500">
                Tổng phương thức
              </p>
              <p className="mt-1 text-2xl font-black">{items.length}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200"
              )}
            >
              <p className="text-sm font-semibold text-slate-500">Đang bật</p>
              <p className="mt-1 text-2xl font-black text-emerald-500">
                {activeCount}
              </p>
            </div>
            <div
              className={cn(
                "rounded-2xl border p-4",
                dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200"
              )}
            >
              <p className="text-sm font-semibold text-slate-500">
                Có thể dùng ngoài web
              </p>
              <p className="mt-1 text-2xl font-black text-[#1677ff]">
                {activeCount}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-500">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        ) : null}

        <div className="space-y-6">
          {formOpen ? (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) resetForm();
              }}
            >
              <div
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
              >
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div className="flex min-w-0 items-start gap-3">
              <span className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#1677ff]">
                {editingId ? (
                  <Edit3 className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {editingId
                    ? t("paymentMethods.form.editTitle")
                    : t("paymentMethods.form.createTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("paymentMethods.form.description")}
                </p>
                <p className="hidden">
                  Dữ liệu này sẽ hiện ở trang nạp tiền.
                </p>
              </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label={t("paymentMethods.action.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  {t("paymentMethods.column.method")}
                </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.type")} <span className="text-rose-600">*</span>
                  </span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateType(event.target.value as PaymentMethodType)
                    }
                    disabled={saving}
                    className={paymentModalFieldClass}
                  >
                    <option value="BANK">{t("paymentMethods.type.bank")}</option>
                    <option value="EWALLET">{t("paymentMethods.type.ewallet")}</option>
                    <option value="CRYPTO">{t("paymentMethods.type.crypto")}</option>
                  </select>
                </label>

                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.status")} <span className="text-rose-600">*</span>
                  </span>
                  <select
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      updateField("isActive", event.target.value === "active")
                    }
                    disabled={saving}
                    className={paymentModalFieldClass}
                  >
                    <option value="active">{t("paymentMethods.status.active")}</option>
                    <option value="inactive">{t("paymentMethods.status.inactive")}</option>
                  </select>
                </label>

                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.bankName")} <span className="text-rose-600">*</span>
                  </span>
                  <select
                    value={form.bankName}
                    onChange={(event) => updateBankPreset(event.target.value)}
                    disabled={saving}
                    required
                    className={paymentModalFieldClass}
                  >
                    {!bankPresets.some((preset) => preset.value === form.bankName) &&
                    form.bankName ? (
                      <option value={form.bankName}>{form.bankName}</option>
                    ) : null}
                    {bankPresets.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.name")} <span className="text-rose-600">*</span>
                  </span>
                  <div className="flex gap-4">
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      disabled={saving}
                      required
                      className={cn(paymentModalFieldClass, "min-w-0 flex-1")}
                      placeholder="MB Bank"
                    />
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sky-600 dark:border-white/10 dark:bg-slate-950 dark:text-sky-300">
                      {form.logo ? (
                        <img
                          src={form.logo}
                          alt={form.name || form.bankName}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <CreditCard className="h-6 w-6" />
                      )}
                    </span>
                  </div>
                </label>

                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.accountName")} <span className="text-rose-600">*</span>
                  </span>
                  <input
                    value={form.accountName}
                    onChange={(event) => updateField("accountName", event.target.value)}
                    disabled={saving}
                    required
                    className={paymentModalFieldClass}
                  />
                </label>

                <label className="relative block">
                  <span className={paymentModalLabelClass}>
                    {t("paymentMethods.field.accountNumber")} <span className="text-rose-600">*</span>
                  </span>
                  <input
                    value={form.accountNumber}
                    onChange={(event) =>
                      updateField("accountNumber", event.target.value)
                    }
                    disabled={saving}
                    required
                    className={paymentModalFieldClass}
                  />
                </label>
              </div>
              </section>
            </div>

            <div className="hidden">
              <div className="grid gap-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t("paymentMethods.column.method")}
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
               <label className="block md:col-span-2">
                <span className="text-sm font-bold">Tên hiển thị</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className={cn(
                    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                    dark
                      ? ""
                      : ""
                  )}
                  placeholder="Ví dụ: Vietcombank"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="hidden">
                  <span className="text-sm font-bold">Mã</span>
                  <input
                    value={form.code}
                    onChange={(event) => updateField("code", event.target.value)}
                    className={cn(
                      "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                      dark
                        ? ""
                        : ""
                    )}
                    placeholder="VCB"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">Loại</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateField("type", event.target.value as PaymentMethodType)
                    }
                    className={cn(
                      "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100",
                      dark
                        ? ""
                        : ""
                    )}
                  >
                    <option value="BANK">Ngân hàng</option>
                    <option value="EWALLET">Ví điện tử</option>
                    <option value="CRYPTO">Tiền điện tử</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold">Tên ngân hàng</span>
                <input
                  value={form.bankName}
                  onChange={(event) => updateField("bankName", event.target.value)}
                  className={cn(
                    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                    dark
                      ? ""
                      : ""
                  )}
                  placeholder="Vietcombank"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Số tài khoản</span>
                  <input
                    value={form.accountNumber}
                    onChange={(event) =>
                      updateField("accountNumber", event.target.value)
                    }
                    className={cn(
                       "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                      dark
                         ? ""
                         : ""
                    )}
                    placeholder="1036679086"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">Tiền tố nội dung</span>
                  <input
                    value={form.transferPrefix}
                    onChange={(event) =>
                      updateField("transferPrefix", event.target.value)
                    }
                    className={cn(
                       "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                      dark
                         ? ""
                         : ""
                    )}
                    placeholder="EVR"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold">Chủ tài khoản</span>
                <input
                  value={form.accountName}
                  onChange={(event) =>
                    updateField("accountName", event.target.value)
                  }
                  className={cn(
                    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                    dark
                      ? ""
                      : ""
                  )}
                  placeholder="Cong ty TNHH..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold">Mô tả</span>
                <input
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className={cn(
                    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                    dark
                      ? ""
                      : ""
                  )}
                  placeholder="VietQR, Internet Banking..."
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Logo URL</span>
                  <input
                    value={form.logo}
                    onChange={(event) => updateField("logo", event.target.value)}
                    className={cn(
                       "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                      dark
                         ? ""
                         : ""
                    )}
                    placeholder="https://..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">QR URL</span>
                  <input
                    value={form.qrImage}
                    onChange={(event) => updateField("qrImage", event.target.value)}
                    className={cn(
                       "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                      dark
                         ? ""
                         : ""
                    )}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="hidden">
                  <span className="text-sm font-bold">Thứ tự</span>
                  <input
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateField("sortOrder", event.target.value)
                    }
                    type="number"
                    className={cn(
                      "mt-2 h-11 w-full rounded-2xl border px-4 text-sm outline-none transition",
                      dark
                        ? "border-white/10 bg-white/5 focus:border-[#1677ff]"
                        : "border-slate-200 bg-white focus:border-[#1677ff]"
                    )}
                  />
                </label>

                <label className="flex items-end">
                  <span
                    className={cn(
                      "flex h-11 w-full items-center justify-between rounded-2xl border px-4 text-sm font-bold",
                      dark ? "border-white/10 bg-white/5" : "border-slate-200"
                    )}
                  >
                    Đang hoạt động
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        updateField("isActive", event.target.checked)
                      }
                      className="h-4 w-4 accent-[#1677ff]"
                    />
                  </span>
                </label>
              </div>
              </div>
                </section>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {t("paymentMethods.action.close")}
                </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("dict.save")}
              </button>
            </div>
          </form>
              </div>
            </div>
          ) : null}

          <section className="contents">
            <div className="hidden">
              <div>
                <h2 className="text-lg font-black">
                  Danh sách phương thức
                </h2>
                <p className="text-sm text-slate-500">
                  Phương thức bật sẽ hiện cho học viên khi nạp tiền.
                </p>
              </div>
              <CreditCard className="h-5 w-5 text-[#1677ff]" />
            </div>

            <AdminListTable<PaymentMethodItem, PaymentMethodSortKey>
              rows={pagedItems}
              columns={tableColumns}
              rowKey={(item) => item._id}
              loading={loading}
              searchValue={search}
              searchPlaceholder={t("paymentMethods.searchPlaceholder")}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              filterSections={filterSections}
              activeFilterCount={activeFilterCount}
              onApplyFilters={() => setPage(1)}
              onClearFilters={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
                setPage(1);
              }}
              sortBy={sortKey}
              sortOrder={sortDirection}
              onSortChange={(nextSortBy, nextSortOrder) => {
                setSortKey(nextSortBy);
                setSortDirection(nextSortOrder);
                setPage(1);
              }}
              onReload={loadItems}
              toolbarEnd={
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  {t("paymentMethods.action.create")}
                </button>
              }
              pagination={{
                currentPage,
                totalPages,
                totalItems: sortedItems.length,
                pageSize: rowsPerPage,
                onPageSizeChange: (nextPageSize) => {
                  setRowsPerPage(nextPageSize);
                  setPage(1);
                },
                onPageChange: setPage,
                pageSizeOptions: [5, 10, 20],
              }}
              emptyText={t("paymentMethods.empty")}
              tableMinWidthClassName="min-w-[1080px]"
            />

            <div className="hidden">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#1677ff]" />
              </div>
            ) : items.length === 0 ? (
              <div
                className={cn(
                  "rounded-2xl border border-dashed px-5 py-12 text-center text-sm font-semibold",
                  dark
                    ? "border-white/10 text-slate-400"
                    : "border-slate-200 text-slate-500"
                )}
              >
                Chưa có phương thức thanh toán nào.
              </div>
            ) : (
              <div>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border shadow-sm",
                    dark
                      ? "border-white/10 bg-slate-950/45"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <table className="w-full min-w-[980px] table-fixed border-collapse text-sm">
                    <thead
                      className={cn(
                        "border-b",
                        dark
                          ? "border-white/10 bg-slate-950 text-slate-100"
                          : "border-slate-200 bg-white text-slate-900"
                      )}
                    >
                      <tr>
                        <th className="w-[30%] px-4 py-3 text-left text-sm font-bold">Phuong thuc</th>
                        <th className="w-[14%] px-4 py-3 text-left text-sm font-bold">Loai</th>
                        <th className="w-[28%] px-4 py-3 text-left text-sm font-bold">Tai khoan</th>
                        <th className="w-[13%] px-4 py-3 text-left text-sm font-bold">Trang thai</th>
                        <th className="w-[15%] px-4 py-3 text-right text-sm font-bold">Thao tac</th>
                      </tr>
                    </thead>
                    <tbody
                      className={cn(
                        "divide-y",
                        dark ? "divide-white/10" : "divide-slate-200"
                      )}
                    >
                      {items.map((item) => (
                        <tr
                          key={item._id}
                          className={cn(
                            "transition",
                            editingId === item._id
                              ? dark
                                ? "bg-[#1677ff]/10"
                                : "bg-[#eef4ff]"
                              : dark
                                ? "hover:bg-white/[0.04]"
                                : "hover:bg-slate-50"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <MethodLogo method={item} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {item.code || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                            {typeLabel(item.type)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <p className="truncate font-semibold">
                              {item.bankName || item.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs">
                              STK: {item.accountNumber || "-"}
                            </p>
                            <p className="mt-0.5 truncate text-xs">
                              Chu TK: {item.accountName || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex h-6 min-w-[96px] items-center justify-center rounded-xl px-3 text-[11px] font-semibold uppercase",
                                item.isActive !== false
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-700"
                              )}
                            >
                              {item.isActive !== false ? "Dang bat" : "Tam tat"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => void toggleActive(item)}
                                className={cn(
                                  "h-8 rounded-lg px-3 text-xs font-semibold transition",
                                  item.isActive !== false
                                    ? "text-amber-700 hover:bg-amber-500/10"
                                    : "text-emerald-700 hover:bg-emerald-500/10"
                                )}
                              >
                                {item.isActive !== false ? "Tat" : "Bat"}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-sky-500/10 hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-300"
                                aria-label="Sua"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeItem(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-500/10"
                                aria-label="Xoa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="hidden">
                <div
                  className={cn(
                    "grid min-w-[860px] grid-cols-[minmax(260px,1.3fr)_150px_minmax(220px,1fr)_130px_150px] gap-4 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em]",
                    dark ? "bg-white/[0.04] text-slate-400" : "bg-slate-50 text-slate-500"
                  )}
                >
                  <span>Phuong thuc</span>
                  <span>Loai</span>
                  <span>Tai khoan</span>
                  <span>Trang thai</span>
                  <span className="text-right">Thao tac</span>
                </div>
                {items.map((item) => (
                  <article
                    key={item._id}
                    className={cn(
                      "min-w-[860px] rounded-2xl border px-4 py-3 transition",
                      editingId === item._id
                        ? "border-[#1677ff]"
                        : dark
                          ? "border-white/10"
                          : "border-slate-200",
                      dark ? "bg-white/[0.03]" : "bg-white"
                    )}
                  >
                    <div className="grid grid-cols-[minmax(260px,1.3fr)_150px_minmax(220px,1fr)_130px_150px] items-center gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <MethodLogo method={item} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-black">
                              {item.name}
                            </h3>
                            <span
                              className={cn(
                                "hidden rounded-full px-2.5 py-1 text-xs font-black",
                                item.isActive !== false
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {item.isActive !== false ? "Đang bật" : "Tạm tắt"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.code} · {typeLabel(item.type)}
                          </p>
                          <p className="hidden mt-2 text-sm text-slate-500">
                            {item.bankName || item.name} · STK:{" "}
                            {item.accountNumber || "-"}
                          </p>
                          <p className="hidden mt-1 text-sm text-slate-500">
                            Chủ TK: {item.accountName || "-"}
                          </p>
                          {item.description ? (
                            <p className="hidden mt-2 text-sm text-slate-500">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <p className="text-sm font-bold text-slate-500">
                        {typeLabel(item.type)}
                      </p>

                      <div className="min-w-0 text-sm text-slate-500">
                        <p className="truncate font-bold text-current">
                          {item.bankName || item.name}
                        </p>
                        <p className="mt-1 truncate">
                          STK: {item.accountNumber || "-"}
                        </p>
                        <p className="mt-1 truncate">
                          Chu TK: {item.accountName || "-"}
                        </p>
                      </div>

                      <div>
                        <span
                          className={cn(
                            "inline-flex min-w-[92px] justify-center rounded-full px-2.5 py-1 text-xs font-black",
                            item.isActive !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {item.isActive !== false ? "Dang bat" : "Tam tat"}
                        </span>
                      </div>

                      <div className="flex shrink-0 justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleActive(item)}
                          className={cn(
                            "h-10 rounded-xl px-3 text-xs font-black transition",
                            item.isActive !== false
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          )}
                        >
                          {item.isActive !== false ? "Tắt" : "Bật"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1677ff] transition hover:bg-[#dbeafe]"
                          aria-label="Sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeItem(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
