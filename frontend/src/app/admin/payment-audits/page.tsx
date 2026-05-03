"use client";

import { useEffect, useMemo, useState } from "react";
import {
  paymentAuditApi,
  type PaymentAuditAction,
  type PaymentAuditActorType,
  type PaymentAuditItem,
} from "@/app/api/payment-audit.api";

const PAYMENT_ACTIONS: ReadonlyArray<{
  label: string;
  value: PaymentAuditAction;
}> = [
  { label: "CHECKOUT_CREATED", value: "CHECKOUT_CREATED" },
  { label: "RETURN_RECEIVED", value: "RETURN_RECEIVED" },
  { label: "IPN_RECEIVED", value: "IPN_RECEIVED" },
  { label: "MARK_PAID", value: "MARK_PAID" },
  { label: "MARK_FAILED", value: "MARK_FAILED" },
  { label: "MARK_CANCELLED", value: "MARK_CANCELLED" },
  { label: "DUPLICATE_IGNORED", value: "DUPLICATE_IGNORED" },
  { label: "ADMIN_NOTE", value: "ADMIN_NOTE" },
];

const ACTOR_TYPES: ReadonlyArray<{
  label: string;
  value: PaymentAuditActorType;
}> = [
  { label: "SYSTEM", value: "SYSTEM" },
  { label: "USER", value: "USER" },
  { label: "ADMIN", value: "ADMIN" },
  { label: "VNPAY", value: "VNPAY" },
];

type PaymentAuditFilters = {
  keyword: string;
  paymentCode: string;
  provider: "" | "vnpay" | "payos";
  action: "" | PaymentAuditAction;
  actorType: "" | PaymentAuditActorType;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("vi-VN");
}

function formatMoney(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(value || 0);
}

function badgeClass(action: PaymentAuditAction) {
  switch (action) {
    case "MARK_PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200";
    case "MARK_FAILED":
    case "MARK_CANCELLED":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200";
    case "ADMIN_NOTE":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200";
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: {
        data?: {
          message?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

export default function AdminPaymentAuditsPage() {
  const [items, setItems] = useState<PaymentAuditItem[]>([]);
  const [timeline, setTimeline] = useState<PaymentAuditItem[]>([]);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<number | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [paymentCodeInput, setPaymentCodeInput] = useState("");
  const [provider, setProvider] = useState<"" | "vnpay" | "payos">("");
  const [action, setAction] = useState<"" | PaymentAuditAction>("");
  const [actorType, setActorType] = useState<"" | PaymentAuditActorType>("");

  const [query, setQuery] = useState<PaymentAuditFilters>({
    keyword: "",
    paymentCode: "",
    provider: "",
    action: "",
    actorType: "",
  });

  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const selectedSummary = useMemo(() => {
    if (!selectedPaymentCode) return null;

    return (
      items.find((item) => item.paymentCode === selectedPaymentCode) ??
      timeline[0] ??
      null
    );
  }, [items, timeline, selectedPaymentCode]);

  async function loadList(nextPage = 1) {
    try {
      setLoadingList(true);
      setError("");

      const res = await paymentAuditApi.getAdminList({
        page: nextPage,
        limit: 12,
        keyword: query.keyword || undefined,
        paymentCode: query.paymentCode ? Number(query.paymentCode) : undefined,
        provider: query.provider || undefined,
        action: query.action || undefined,
        actorType: query.actorType || undefined,
      });

      setItems(res.items);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);

      if (!selectedPaymentCode && res.items.length > 0) {
        void openTimeline(res.items[0].paymentCode);
      }

      if (
        selectedPaymentCode !== null &&
        !res.items.some((item) => item.paymentCode === selectedPaymentCode)
      ) {
        setTimeline([]);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Không tải được kiểm tra thanh toán"));
    } finally {
      setLoadingList(false);
    }
  }

  async function openTimeline(paymentCode: number) {
    try {
      setSelectedPaymentCode(paymentCode);
      setLoadingTimeline(true);
      setError("");

      const res = await paymentAuditApi.getAdminTimeline(paymentCode);
      setTimeline(res.items);
    } catch (error: unknown) {
      setTimeline([]);
      setError(getErrorMessage(error, "Không tải được dòng thời gian"));
    } finally {
      setLoadingTimeline(false);
    }
  }

  async function submitNote() {
    if (!selectedPaymentCode || !note.trim()) return;

    try {
      setSubmittingNote(true);
      setError("");

      await paymentAuditApi.addAdminNote(selectedPaymentCode, note.trim());
      setNote("");
      await openTimeline(selectedPaymentCode);
      await loadList(page);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Không thêm được ghi chú"));
    } finally {
      setSubmittingNote(false);
    }
  }

  function applyFilters() {
    setPage(1);
    setQuery({
      keyword: keyword.trim(),
      paymentCode: paymentCodeInput.trim(),
      provider,
      action,
      actorType,
    });
  }

  function resetFilters() {
    setKeyword("");
    setPaymentCodeInput("");
    setProvider("");
    setAction("");
    setActorType("");
    setPage(1);
    setQuery({
      keyword: "",
      paymentCode: "",
      provider: "",
      action: "",
      actorType: "",
    });
  }

  useEffect(() => {
    void loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-transparent">
      <div className="mx-auto max-w-7xl">
        <div className="hidden">
          <h1 className="text-3xl font-extrabold text-slate-900">Kiểm tra thanh toán</h1>
          <p className="mt-2 text-slate-600">
            Theo dõi toàn bộ lịch sử thanh toán, IPN, trả về, đổi trạng thái và ghi chú quản trị.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm ghi chú, người thực hiện..."
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              value={paymentCodeInput}
              onChange={(e) => setPaymentCodeInput(e.target.value)}
              placeholder="Mã thanh toán"
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "" | "vnpay" | "payos")}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Tất cả nhà cung cấp</option>
              <option value="vnpay">vnpay</option>
              <option value="payos">payos</option>
            </select>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "" | PaymentAuditAction)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Tất cả thao tác</option>
              {PAYMENT_ACTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={actorType}
              onChange={(e) =>
                setActorType(e.target.value as "" | PaymentAuditActorType)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Tất cả người thực hiện</option>
              {ACTOR_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={applyFilters}
              className="h-11 rounded-xl bg-slate-900 px-5 font-semibold text-white"
            >
              Lọc dữ liệu
            </button>
            <button
              onClick={resetFilters}
              className="h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              Đặt lại
            </button>
            <div className="ml-auto flex items-center text-sm text-slate-500 dark:text-slate-400">
              Tổng: <span className="ml-1 font-semibold text-slate-900 dark:text-slate-100">{total}</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Danh sách kiểm tra</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Bấm vào mã thanh toán để xem dòng thời gian</p>
            </div>

            {loadingList ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-white/5 dark:text-slate-400">
                Đang tải dữ liệu...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-white/5 dark:text-slate-400">
                Không có dữ liệu
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const active = selectedPaymentCode === item.paymentCode;

                  return (
                    <button
                      key={item._id}
                      onClick={() => openTimeline(item.paymentCode)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-slate-900 bg-slate-50 dark:border-sky-400/40 dark:bg-white/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              #{item.paymentCode}
                            </div>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(
                                item.action
                              )}`}
                            >
                              {item.action}
                            </span>
                          </div>

                          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {item.user?.name || "-"} · {item.user?.email || "-"}
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Số tiền
                          </div>
                          <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                            {formatMoney(item.amount, item.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Mini label="Nhà cung cấp" value={item.provider} />
                        <Mini label="Người thực hiện" value={item.actorType} />
                        <Mini label="Từ" value={item.fromStatus || "-"} />
                        <Mini label="Đến" value={item.toStatus || "-"} />
                      </div>

                      {item.note ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                          {item.note}
                        </div>
                      ) : null}

                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => hasPrev && loadList(page - 1)}
                disabled={!hasPrev || loadingList}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                Trang trước
              </button>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                Trang <span className="font-semibold">{page}</span> / {totalPages}
              </div>

              <button
                onClick={() => hasNext && loadList(page + 1)}
                disabled={!hasNext || loadingList}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                Trang sau
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dòng thời gian</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Lịch sử chi tiết theo từng mã thanh toán
              </p>
            </div>

            {!selectedPaymentCode ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-white/5 dark:text-slate-400">
                Chưa chọn giao dịch
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Mã thanh toán
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    #{selectedPaymentCode}
                  </div>
                  {selectedSummary ? (
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {selectedSummary.user?.name || "-"} ·{" "}
                      {selectedSummary.user?.email || "-"}
                    </div>
                  ) : null}
                </div>

                {loadingTimeline ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    Đang tải dòng thời gian...
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    Chưa có dòng thời gian
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((item) => (
                      <div key={item._id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 dark:bg-slate-950">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.action}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(item.createdAt)}
                            </div>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(
                              item.action
                            )}`}
                          >
                            {item.actorType}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <Mini label="Từ" value={item.fromStatus || "-"} />
                          <Mini label="Đến" value={item.toStatus || "-"} />
                        </div>

                        {item.note ? (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                            {item.note}
                          </div>
                        ) : null}

                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          {item.ipAddr || "-"} · {item.actorName || item.actorType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10 dark:bg-slate-950">
                  <div className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Ghi chú quản trị</div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Nhập ghi chú cho giao dịch này..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    onClick={submitNote}
                    disabled={submittingNote || !note.trim() || !selectedPaymentCode}
                    className="mt-3 h-11 rounded-xl bg-slate-900 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingNote ? "Đang lưu..." : "Lưu ghi chú"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
