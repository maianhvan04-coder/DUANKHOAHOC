"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  securityAuditApi,
  type SecurityAuditItem,
} from "@/app/api/security-audit.api";

const ACTION_OPTIONS = [
  { label: "Tất cả action", value: "" },
  { label: "LOGIN_SUCCESS", value: "LOGIN_SUCCESS" },
  { label: "LOGIN_FAILED", value: "LOGIN_FAILED" },
  { label: "LOGOUT", value: "LOGOUT" },
  { label: "REGISTER", value: "REGISTER" },
  { label: "REFRESH_TOKEN", value: "REFRESH_TOKEN" },
  { label: "ACCESS_GRANTED", value: "ACCESS_GRANTED" },
  { label: "ACCESS_DENIED", value: "ACCESS_DENIED" },
  { label: "PASSWORD_CHANGED", value: "PASSWORD_CHANGED" },
  { label: "PASSWORD_RESET_REQUEST", value: "PASSWORD_RESET_REQUEST" },
  { label: "PASSWORD_RESET_SUCCESS", value: "PASSWORD_RESET_SUCCESS" },
] as const;

type SuccessFilter = "" | "true" | "false";

type Filters = {
  keyword: string;
  email: string;
  path: string;
  ipAddress: string;
  action: string;
  success: SuccessFilter;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("vi-VN");
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

function getSuccessClasses(success: boolean) {
  return success
    ? {
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        card:
          "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-emerald-100/60",
        line: "bg-emerald-500",
        soft: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      }
    : {
        badge:
          "border-rose-200 bg-rose-50 text-rose-700",
        card:
          "border-rose-200/70 bg-white hover:border-rose-300 hover:shadow-rose-100/60",
        line: "bg-rose-500",
        soft: "bg-rose-50 text-rose-700 border border-rose-100",
      };
}

function getInitials(name: string, email: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function StatCard({
  icon,
  label,
  value,
  tone = "slate",
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "slate" | "emerald" | "rose" | "blue";
  subtext?: string;
}) {
  const toneMap = {
    slate: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    rose: "bg-rose-50 border-rose-100 text-rose-900",
    blue: "bg-blue-50 border-blue-100 text-blue-900",
  };

  const iconToneMap = {
    slate: "bg-slate-900 text-white",
    emerald: "bg-emerald-600 text-white",
    rose: "bg-rose-600 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm ${toneMap[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
          {subtext ? (
            <div className="mt-2 text-sm text-slate-500">{subtext}</div>
          ) : null}
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconToneMap[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    >
      {children}
    </select>
  );
}

function MetaBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 break-all text-sm font-semibold text-slate-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function SecurityAuditCard({ item }: { item: SecurityAuditItem }) {
  const userName = item.user?.name || item.userName || "Người dùng hệ thống";
  const userEmail = item.user?.email || item.userEmail || "-";
  const tone = getSuccessClasses(item.success);
  const initials = getInitials(userName, userEmail);

  return (
    <article
      className={`group relative overflow-hidden rounded-[30px] border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${tone.card}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${tone.line}`} />

      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${tone.soft}`}
              >
                {item.success ? "SUCCESS" : "FAILED"}
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {item.action}
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                HTTP {item.statusCode || 0}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold leading-tight text-slate-950">
                  {userName}
                </div>
                <div className="mt-1 break-all text-sm text-slate-500">
                  {userEmail}
                </div>

                {item.message ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {item.message}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid min-w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[360px] xl:max-w-[420px]">
            <MetaBox label="Thời gian" value={formatDate(item.createdAt)} />
            <MetaBox label="Kết quả" value={item.success ? "Thành công" : "Bị từ chối"} />
            <MetaBox label="Method" value={item.method || "-"} />
            <MetaBox label="IP Address" value={item.ipAddress || "-"} mono />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]">
          <MetaBox label="API Path" value={item.path || "-"} mono />

          {item.userAgent ? (
            <MetaBox label="User Agent" value={item.userAgent} />
          ) : (
            <MetaBox label="User Agent" value="-" />
          )}
        </div>
      </div>
    </article>
  );
}

function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-6 w-48 rounded-xl bg-slate-200" />
            <div className="mt-4 h-5 w-72 rounded-xl bg-slate-100" />
            <div className="mt-3 h-16 w-full rounded-2xl bg-slate-100" />
          </div>
          <div className="grid w-[360px] grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function AdminSecurityAuditsPage() {
  const [items, setItems] = useState<SecurityAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [email, setEmail] = useState("");
  const [path, setPath] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [action, setAction] = useState("");
  const [success, setSuccess] = useState<SuccessFilter>("");

  const [query, setQuery] = useState<Filters>({
    keyword: "",
    email: "",
    path: "",
    ipAddress: "",
    action: "",
    success: "",
  });

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const stats = useMemo(() => {
    const successCount = items.filter((item) => item.success).length;
    const failedCount = items.filter((item) => !item.success).length;

    return {
      shown: items.length,
      successCount,
      failedCount,
      successRate:
        items.length > 0 ? Math.round((successCount / items.length) * 100) : 0,
    };
  }, [items]);

  async function loadData(nextPage = 1, nextQuery = query) {
    try {
      setLoading(true);
      setError("");

      const res = await securityAuditApi.getAdminList({
        page: nextPage,
        limit: 10,
        keyword: nextQuery.keyword || undefined,
        email: nextQuery.email || undefined,
        path: nextQuery.path || undefined,
        ipAddress: nextQuery.ipAddress || undefined,
        action: nextQuery.action || undefined,
        success:
          nextQuery.success === ""
            ? undefined
            : nextQuery.success === "true",
      });

      const nextItems = Array.isArray(res.items) ? res.items : [];
      const pagination = res.pagination ?? {
        page: nextPage,
        limit: 10,
        total: 0,
        totalPages: 1,
      };

      setItems(nextItems);
      setPage(typeof pagination.page === "number" ? pagination.page : nextPage);
      setTotal(typeof pagination.total === "number" ? pagination.total : 0);
      setTotalPages(
        typeof pagination.totalPages === "number" ? pagination.totalPages : 1
      );
    } catch (error: unknown) {
      setItems([]);
      setPage(1);
      setTotal(0);
      setTotalPages(1);
      setError(getErrorMessage(error, "Không tải được audit bảo mật"));
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const nextQuery: Filters = {
      keyword: keyword.trim(),
      email: email.trim(),
      path: path.trim(),
      ipAddress: ipAddress.trim(),
      action: action.trim(),
      success,
    };

    setPage(1);
    setQuery(nextQuery);
  }

  function resetFilters() {
    setKeyword("");
    setEmail("");
    setPath("");
    setIpAddress("");
    setAction("");
    setSuccess("");

    const nextQuery: Filters = {
      keyword: "",
      email: "",
      path: "",
      ipAddress: "",
      action: "",
      success: "",
    };

    setPage(1);
    setQuery(nextQuery);
  }

  useEffect(() => {
    void loadData(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="hidden" />
          <div className="hidden" />

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                <Activity className="h-4 w-4" />
                Trung tâm giám sát bảo mật
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Audit bảo mật hệ thống
              </h1>

              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-base">
                Theo dõi lịch sử đăng nhập, truy cập API, kiểm tra quyền và các
                thao tác bảo mật quan trọng theo thời gian thực với giao diện rõ
                ràng, hiện đại và dễ đọc.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => loadData(page, query)}
                disabled={loading}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>

              <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm">
                Tổng bản ghi: <span className="font-black">{total}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Tổng kết quả"
            value={total}
            tone="slate"
            subtext="Tổng số bản ghi theo bộ lọc hiện tại"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Đang hiển thị"
            value={stats.shown}
            tone="blue"
            subtext="Số bản ghi trên trang hiện tại"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Thành công"
            value={stats.successCount}
            tone="emerald"
            subtext={`Tỷ lệ thành công: ${stats.successRate}%`}
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Bị từ chối"
            value={stats.failedCount}
            tone="rose"
            subtext="Bao gồm lỗi xác thực hoặc không đủ quyền"
          />
        </section>

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                <Filter className="h-4 w-4" />
                Bộ lọc dữ liệu
              </div>
              <div className="mt-3 text-xl font-black text-slate-950">
                Tìm nhanh bản ghi cần kiểm tra
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Lọc theo email, action, đường dẫn API, IP hoặc trạng thái xử lý.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Trang hiện tại: <span className="font-bold text-slate-900">{page}</span> /{" "}
              {totalPages}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FilterField label="Từ khóa chung">
              <Input
                value={keyword}
                onChange={setKeyword}
                placeholder="Tên người dùng, email, message..."
              />
            </FilterField>

            <FilterField label="Email">
              <Input
                value={email}
                onChange={setEmail}
                placeholder="Nhập email cần tìm"
              />
            </FilterField>

            <FilterField label="API path">
              <Input
                value={path}
                onChange={setPath}
                placeholder="/api/auth/login"
              />
            </FilterField>

            <FilterField label="IP address">
              <Input
                value={ipAddress}
                onChange={setIpAddress}
                placeholder="127.0.0.1"
              />
            </FilterField>

            <FilterField label="Action">
              <Select value={action} onChange={setAction}>
                {ACTION_OPTIONS.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Kết quả">
              <Select
                value={success}
                onChange={(value) => setSuccess(value as SuccessFilter)}
              >
                <option value="">Tất cả kết quả</option>
                <option value="true">Thành công</option>
                <option value="false">Bị từ chối</option>
              </Select>
            </FilterField>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={applyFilters}
              className="inline-flex h-14 items-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-sm transition hover:translate-y-[-1px] hover:opacity-95"
            >
              <Filter className="h-4 w-4" />
              Lọc dữ liệu
            </button>

            <button
              onClick={resetFilters}
              className="inline-flex h-14 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại
            </button>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-black text-slate-950">
                Danh sách bản ghi
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Hiển thị các hoạt động bảo mật mới nhất theo bộ lọc hiện tại.
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Đang hiển thị <span className="font-bold text-slate-900">{items.length}</span> /
              <span className="font-bold text-slate-900"> {total}</span> bản ghi
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
                <ShieldAlert className="h-7 w-7 text-slate-400" />
              </div>
              <div className="mt-5 text-2xl font-black text-slate-900">
                Không có dữ liệu phù hợp
              </div>
              <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Hệ thống chưa có audit tương ứng với bộ lọc hiện tại hoặc chưa
                phát sinh thao tác bảo mật nào để ghi log.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <SecurityAuditCard key={item._id} item={item} />
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => hasPrev && loadData(page - 1, query)}
              disabled={!hasPrev || loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </button>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Trang <span className="font-black text-slate-950">{page}</span> / {totalPages}
            </div>

            <button
              onClick={() => hasNext && loadData(page + 1, query)}
              disabled={!hasNext || loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
