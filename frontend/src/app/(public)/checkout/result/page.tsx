"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 text-sm text-slate-500">{label}</div>
      <div className="wrap-break-word font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function CheckoutResultPage() {
  const searchParams = useSearchParams();

  const provider = searchParams.get("provider") || "vnpay";
  const paymentCode = searchParams.get("paymentCode") || "-";
  const code = searchParams.get("code") || "-";
  const transactionStatus = searchParams.get("transactionStatus") || "-";
  const valid = searchParams.get("valid") === "1";
  const success = searchParams.get("success") === "1";
  const transactionNo = searchParams.get("transactionNo") || "-";
  const bankCode = searchParams.get("bankCode") || "-";
  const amount = Number(searchParams.get("amount") || 0);

  const isPaid =
    valid &&
    success &&
    code === "00" &&
    (transactionStatus === "00" || transactionStatus === "-");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div
          className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full text-3xl ${
            isPaid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isPaid ? "✓" : "!"}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900">
          {isPaid ? "Thanh toán thành công" : "Thanh toán chưa thành công"}
        </h1>

        <p className="mt-3 text-base leading-7 text-slate-600">
          {isPaid
            ? "Đơn hàng của bạn đã được thanh toán thành công qua VNPAY."
            : "Đã có vấn đề trong quá trình xử lý thanh toán. Bạn hãy kiểm tra lại thông tin bên dưới."}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Info label="Cổng thanh toán" value={provider} />
          <Info label="Mã đơn" value={paymentCode} />
          <Info label="Mã phản hồi" value={code} />
          <Info label="Trạng thái giao dịch" value={transactionStatus} />
          <Info label="Mã giao dịch VNPAY" value={transactionNo} />
          <Info label="Ngân hàng" value={bankCode} />
          <Info
            label="Số tiền"
            value={amount > 0 ? `${amount.toLocaleString("vi-VN")} ₫` : "-"}
          />
          <Info label="Chữ ký hợp lệ" value={valid ? "Có" : "Không"} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Về trang chủ
          </Link>

          <Link
            href="/checkout"
            className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-900"
          >
            Quay lại thanh toán
          </Link>
        </div>
      </div>
    </main>
  );
}