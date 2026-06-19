"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  History,
  Landmark,
  Loader2,
  QrCode,
  ReceiptText,
  Wallet,
  X,
} from "lucide-react";

import {
  paymentMethodApi,
  type PaymentMethodItem,
  type PaymentMethodType,
} from "@/app/api/payment-method.api";
import {
  walletApi,
  type WalletResponse,
  type WalletTransaction,
} from "@/app/api/wallet.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { emitWalletBalanceChanged } from "@/lib/utils/wallet-events";

type WalletTab = "overview" | "topups" | "transactions";

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

const QUICK_AMOUNTS = [100000, 300000, 500000, 1000000, 2000000];

const QR_CELLS = [
  1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1,
  0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1,
  1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1,
];

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

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

function getMethodInitial(method: PaymentMethodItem) {
  const source = method.code || method.name || "PM";
  return source.slice(0, 3).toUpperCase();
}

function getTypeLabel(type: PaymentMethodType) {
  if (type === "EWALLET") return "Ví điện tử";
  if (type === "CRYPTO") return "Tiền điện tử";
  return "Thanh toán nội địa";
}

function getTransactionLabel(type: WalletTransaction["type"]) {
  if (type === "TOPUP") return "Nạp tiền";
  if (type === "ENROLL") return "Đăng ký khóa học";
  if (type === "ADMIN_DEBIT") return "Điều chỉnh giảm";
  return "Hoàn tiền";
}

function getTransactionAmountClass(type: WalletTransaction["type"]) {
  return type === "ENROLL" || type === "ADMIN_DEBIT"
    ? "text-rose-400"
    : "text-emerald-400";
}

function buildTransferCode(method: PaymentMethodItem) {
  const prefix = method.transferPrefix || "EVR";
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${Date.now().toString().slice(-4)}${suffix}`;
}

function getVietQrBankBin(method: PaymentMethodItem) {
  const source = `${method.bankName || ""} ${method.name || ""} ${method.code || ""}`.toUpperCase();

  if (source.includes("VIETIN") || source.includes("VTB")) return "970415";
  if (source.includes("MB") || source.includes("MBB")) return "970422";

  return "";
}

function buildVietQrImageUrl(
  method: PaymentMethodItem,
  amount: number,
  transferCode: string
) {
  const bankBin = getVietQrBankBin(method);
  const accountNumber = String(method.accountNumber || "").replace(/\s+/g, "");

  if (!bankBin || !accountNumber || !Number.isFinite(amount) || amount <= 0) {
    return method.qrImage || "";
  }

  const query = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: transferCode,
  });

  if (method.accountName) {
    query.set("accountName", method.accountName);
  }

  return `https://img.vietqr.io/image/${bankBin}-${encodeURIComponent(
    accountNumber
  )}-compact2.png?${query.toString()}`;
}

function FakeQr() {
  return (
    <div className="relative grid h-[248px] w-[248px] grid-cols-8 gap-1 rounded-xl bg-white p-5 shadow-inner">
      {QR_CELLS.map((cell, index) => (
        <span
          key={index}
          className={cn(
            "aspect-square rounded-[2px]",
            cell ? "bg-slate-950" : "bg-white"
          )}
        />
      ))}
      <div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0D56A6] shadow">
        <QrCode className="h-7 w-7" />
      </div>
    </div>
  );
}

function MethodLogo({ method }: { method: PaymentMethodItem }) {
  if (method.logo) {
    return (
      <img
        src={method.logo}
        alt={method.name}
        className="h-10 w-10 rounded-xl object-cover"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4FF] text-xs font-black text-[#0D56A6] ring-1 ring-[#cbe7fb]">
      {getMethodInitial(method)}
    </span>
  );
}

function TransferModal({
  method,
  amount,
  transferCode,
  submitting,
  onClose,
  onConfirm,
}: {
  method: PaymentMethodItem;
  amount: number;
  transferCode: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const qrImageUrl = buildVietQrImageUrl(method, amount, transferCode);

  const copyTransferCode = async () => {
    try {
      await navigator.clipboard.writeText(transferCode);
    } catch {
      // Clipboard is optional here; the code remains visible for manual copy.
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-black">Thông tin chuyển khoản</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-7 px-6 py-7 md:grid-cols-[280px_1fr]">
          <div>
            <div className="flex justify-center rounded-2xl bg-white p-4">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt={`QR ${method.name}`}
                  className="h-[248px] w-[248px] rounded-xl object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FakeQr />
              )}
            </div>
            <div className="mt-4 space-y-1 text-sm font-semibold text-slate-300">
              <p>* Vui lòng chuyển đúng số tiền và nội dung.</p>
              <p>* Sau khi xác nhận, hệ thống sẽ cộng số dư vào ví học tập.</p>
              <p>* Nếu chuyển khoản thật, admin có thể đối soát lại giao dịch.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-lg font-black">Thông tin ngân hàng</p>
              <p className="mt-1 text-sm text-slate-500">
                Kiểm tra kỹ thông tin trước khi chuyển khoản.
              </p>
            </div>

            <div className="space-y-4 text-[15px]">
              <div className="flex gap-3">
                <span className="w-36 shrink-0 text-slate-500">Ngân hàng:</span>
                <span className="font-bold">{method.bankName || method.name}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-36 shrink-0 text-slate-500">Số tài khoản:</span>
                <span className="font-bold">{method.accountNumber || "-"}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-36 shrink-0 text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold">{method.accountName || "-"}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-36 shrink-0 text-slate-500">Số tiền:</span>
                <span className="font-black text-[#0D56A6]">{formatMoney(amount)}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-36 shrink-0 text-slate-500">
                  Nội dung chuyển khoản:
                </span>
                <span className="flex min-w-0 items-center gap-2 font-black text-[#0D56A6]">
                  <span className="truncate">{transferCode}</span>
                  <button
                    type="button"
                    onClick={() => void copyTransferCode()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Sao chép nội dung chuyển khoản"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0D56A6] px-5 text-base font-black text-white transition hover:bg-[#0B4A8E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {submitting ? "Đang cập nhật ví..." : "Tôi đã chuyển khoản"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WalletTopupPage() {
  const router = useRouter();
  const { user, hydrated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [wallet, setWallet] = useState<WalletResponse>({
    balance: 0,
    transactions: [],
  });
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [amountInput, setAmountInput] = useState("500000");
  const [transferMethod, setTransferMethod] = useState<PaymentMethodItem | null>(
    null
  );
  const [transferCode, setTransferCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amount = parseMoneyInput(amountInput);
  const transactions = wallet.transactions || [];
  const topupTransactions = transactions.filter((item) => item.type === "TOPUP");
  const totalTopup = topupTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = transactions
    .filter((item) => item.type === "ENROLL")
    .reduce((sum, item) => sum + item.amount, 0);

  const selectedMethod = useMemo(
    () => methods.find((item) => item._id === selectedMethodId) || methods[0],
    [methods, selectedMethodId]
  );

  const bankMethods = methods.filter((item) => item.type === "BANK");
  const walletMethods = methods.filter((item) => item.type === "EWALLET");
  const cryptoMethods = methods.filter((item) => item.type === "CRYPTO");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [walletData, methodData] = await Promise.all([
        walletApi.getMine(),
        paymentMethodApi.getActive(),
      ]);

      const nextMethods = methodData.items || [];
      setWallet(walletData);
      setMethods(nextMethods);
      setSelectedMethodId((prev) => prev || nextMethods[0]?._id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải dữ liệu ví học tập."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    void loadData();
  }, [hydrated, isLoading, loadData, router, user]);

  function openTransferModal() {
    setSuccess("");
    setError("");

    if (!selectedMethod) {
      setError("Chưa có phương thức thanh toán khả dụng.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 10000) {
      setError("Số tiền nạp tối thiểu là 10.000đ.");
      return;
    }

    setTransferMethod(selectedMethod);
    setTransferCode(buildTransferCode(selectedMethod));
  }

  async function confirmTransferred() {
    if (!transferMethod || submitting) return;

    try {
      setSubmitting(true);
      setError("");
      const data = await walletApi.topup({ amount });
      const nextWallet = await walletApi.getMine().catch(() => ({
        balance: data.balance,
        transactions,
      }));
      setWallet(nextWallet);
      setSuccess(`Đã nạp ${formatMoney(amount)} vào ví học tập.`);
      setTransferMethod(null);
      emitWalletBalanceChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể cập nhật ví học tập."));
    } finally {
      setSubmitting(false);
    }
  }

  function renderMethodCard(method: PaymentMethodItem) {
    const active = selectedMethod?._id === method._id;

    return (
      <button
        key={method._id}
        type="button"
        onClick={() => setSelectedMethodId(method._id)}
        className={cn(
          "flex min-h-[86px] items-center gap-4 rounded-2xl border p-4 text-left transition",
          active
            ? "border-[#0D56A6] bg-[#F5F9FF] shadow-[0_0_0_2px_rgba(13,86,166,0.12)]"
            : "border-slate-200 bg-white hover:border-[#cbe7fb]"
        )}
      >
        <MethodLogo method={method} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-slate-900">
            {method.name}
          </span>
          <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
            {method.code} · {method.description || getTypeLabel(method.type)}
          </span>
        </span>
      </button>
    );
  }

  function renderTransactions(items: WalletTransaction[]) {
    if (!items.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500">
          Chưa có giao dịch nào.
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Loại</th>
              <th className="px-5 py-4">Mô tả</th>
              <th className="px-5 py-4">Số tiền</th>
              <th className="px-5 py-4">Số dư sau</th>
              <th className="px-5 py-4">Ngày</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item._id} className="text-slate-800">
                <td className="px-5 py-4 font-bold">
                  {getTransactionLabel(item.type)}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {item.note || "-"}
                </td>
                <td
                  className={cn(
                    "px-5 py-4 font-black",
                    getTransactionAmountClass(item.type)
                  )}
                >
                  {item.type === "ENROLL" || item.type === "ADMIN_DEBIT" ? "-" : "+"}
                  {formatMoney(item.amount)}
                </td>
                <td className="px-5 py-4 font-bold">
                  {formatMoney(item.balanceAfter)}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {formatDate(item.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!hydrated || isLoading || loading) {
    return (
      <main className="min-h-[70vh] bg-[#f5f9ff] px-4 py-16 text-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#0D56A6]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f9ff] px-4 py-8 text-slate-950 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0D56A6]">
              Ví học tập
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Nạp tiền và quản lý số dư
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0B2C5F] transition hover:bg-[#F5F9FF]"
          >
            Làm mới
          </button>
        </div>

        <div className="mb-5 flex gap-8 border-b border-slate-200 text-sm font-bold">
          {[
            { key: "overview", label: "Tổng quan", icon: Wallet },
            { key: "topups", label: "Lịch sử nạp", icon: History },
            { key: "transactions", label: "Lịch sử giao dịch", icon: ReceiptText },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key as WalletTab)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 pb-4 transition",
                  active
                    ? "border-[#0D56A6] text-[#0D56A6]"
                    : "border-transparent text-slate-500 hover:text-[#0D56A6]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Số dư khả dụng
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="text-5xl font-black tracking-tight text-[#0D56A6]">
              {formatMoney(wallet.balance)}
            </span>
            <span className="pb-2 text-xl font-black text-slate-500">VND</span>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Khả dụng
              </p>
              <p className="mt-1 font-black">{formatMoney(wallet.balance)}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Đang khóa
              </p>
              <p className="mt-1 font-black">{formatMoney(0)}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Tổng nạp
              </p>
              <p className="mt-1 font-black">{formatMoney(totalTopup)}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Tổng chi
              </p>
              <p className="mt-1 font-black">{formatMoney(totalSpent)}</p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-5 w-1 rounded-full bg-[#0D56A6]" />
                <h2 className="text-lg font-black">Nạp nhanh</h2>
              </div>

              <p className="mb-4 text-sm font-semibold text-slate-500">
                Chọn phương thức thanh toán, nhập số tiền rồi xem thông tin
                chuyển khoản.
              </p>

              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Phương thức thanh toán
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {methods.map(renderMethodCard)}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Số tiền nạp
                  </p>
                  <input
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    inputMode="numeric"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0D56A6]"
                    placeholder="Nhập số tiền"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmountInput(String(value))}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-[#0D56A6] hover:text-[#0D56A6]"
                      >
                        {formatMoney(value)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openTransferModal}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0D56A6] px-5 text-sm font-black text-white transition hover:bg-[#0B4A8E]"
                >
                  Tiến hành nạp
                </button>
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4FF] text-[#0D56A6]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-black">Chi tiết đơn nạp</h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Kiểm tra trước khi tạo chuyển khoản.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Phương thức</span>
                  <span className="font-black">{selectedMethod?.name || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Số tiền nạp</span>
                  <span className="font-black">{formatMoney(amount)}</span>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-black text-[#0D56A6]">
                      {formatMoney(amount)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openTransferModal}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#0D56A6] text-sm font-black text-white transition hover:bg-[#0B4A8E]"
              >
                Thanh toán với {selectedMethod?.name || "phương thức đã chọn"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Số dư trong ví được dùng để đăng ký khóa học online hoặc offline
                khi đủ học phí.
              </p>
            </aside>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-1 rounded-full bg-[#0D56A6]" />
                  <h2 className="text-lg font-black">Hoạt động gần đây</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("transactions")}
                  className="text-sm font-black text-[#0D56A6] hover:underline"
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="overflow-x-auto">
                {renderTransactions(transactions.slice(0, 5))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "topups" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Landmark className="h-5 w-5 text-[#0D56A6]" />
              <h2 className="text-lg font-black">Lịch sử nạp tiền</h2>
            </div>
            <div className="overflow-x-auto">{renderTransactions(topupTransactions)}</div>
          </section>
        ) : null}

        {activeTab === "transactions" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-[#0D56A6]" />
              <h2 className="text-lg font-black">Lịch sử giao dịch</h2>
            </div>
            <div className="overflow-x-auto">{renderTransactions(transactions)}</div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Ngân hàng nội địa", items: bankMethods },
            { title: "Ví điện tử", items: walletMethods },
            { title: "Khác", items: cryptoMethods },
          ].map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-black">{group.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {group.items.length
                  ? group.items.map((item) => item.name).join(", ")
                  : "Chưa cấu hình"}
              </p>
            </div>
          ))}
        </section>
      </div>

      {transferMethod ? (
        <TransferModal
          method={transferMethod}
          amount={amount}
          transferCode={transferCode}
          submitting={submitting}
          onClose={() => setTransferMethod(null)}
          onConfirm={() => void confirmTransferred()}
        />
      ) : null}
    </main>
  );
}
