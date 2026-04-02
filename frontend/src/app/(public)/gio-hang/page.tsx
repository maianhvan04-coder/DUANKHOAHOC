"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import {
  cartApi,
  type CartData,
  type CartItem,
} from "@/app/api/cart.api";
import { paymentApi } from "@/app/api/payment.api";

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
      checkoutUrl?: string;
    };
  };
  message?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";
}

function getErrorMessage(error: unknown, fallback: string): string {
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

function getStatusLabel(status?: string): string {
  if (status === "OPEN") return "Đang mở";
  if (status === "COMING") return "Sắp mở";
  if (status === "FULL") return "Đã đầy";
  return "Đang cập nhật";
}

function getStatusClass(status?: string) {
  if (status === "OPEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "COMING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "FULL") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function CartSkeleton() {
  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 h-36 animate-pulse rounded-[32px] bg-white shadow-sm" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[28px] bg-white shadow-sm" />
            <div className="h-44 animate-pulse rounded-[28px] bg-white shadow-sm" />
            <div className="h-44 animate-pulse rounded-[28px] bg-white shadow-sm" />
          </div>
          <div className="h-[620px] animate-pulse rounded-[32px] bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "",
  strong = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-right ${
          strong ? "font-semibold text-slate-900" : "font-medium text-slate-700"
        } ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchCart = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      const res = await cartApi.getMyCart();
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không tải được giỏ hàng"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const items: CartItem[] = cart?.items ?? [];

  const availableItems = useMemo(() => {
    return items.filter((item) => item.isAvailable !== false);
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => item.selected && item.isAvailable !== false);
  }, [items]);

  const allSelected = useMemo(() => {
    if (!availableItems.length) return false;
    return availableItems.every((item) => item.selected);
  }, [availableItems]);

  const displaySummary = useMemo(() => {
    const totalCourses = selectedItems.length;
    const totalQuantity = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalOriginalPrice = selectedItems.reduce(
      (sum, item) => sum + item.originalPrice * item.quantity,
      0
    );
    const totalPrice = selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalDiscount = Math.max(totalOriginalPrice - totalPrice, 0);

    return {
      totalCourses,
      totalQuantity,
      totalOriginalPrice,
      totalPrice,
      totalDiscount,
    };
  }, [selectedItems]);

  const handleToggleAll = async (): Promise<void> => {
    try {
      setActionLoading(true);
      setError("");
      const res = await cartApi.selectAll({ selected: !allSelected });
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể chọn tất cả"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleItem = async (
    courseId: string,
    selected: boolean
  ): Promise<void> => {
    try {
      setUpdatingId(courseId);
      setError("");
      const res = await cartApi.toggleItemSelected(courseId, { selected });
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể cập nhật chọn khóa học"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleIncreaseQty = async (item: CartItem): Promise<void> => {
    try {
      setUpdatingId(item.courseId);
      setError("");
      const res = await cartApi.updateItemQuantity(item.courseId, {
        quantity: item.quantity + 1,
      });
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể tăng số lượng"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecreaseQty = async (item: CartItem): Promise<void> => {
    if (item.quantity <= 1) return;

    try {
      setUpdatingId(item.courseId);
      setError("");
      const res = await cartApi.updateItemQuantity(item.courseId, {
        quantity: item.quantity - 1,
      });
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể giảm số lượng"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (courseId: string): Promise<void> => {
    try {
      setUpdatingId(courseId);
      setError("");
      const res = await cartApi.removeItem(courseId);
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể xóa khóa học"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearSelected = async (): Promise<void> => {
    if (!selectedItems.length) return;

    try {
      setActionLoading(true);
      setError("");
      await Promise.all(
        selectedItems.map((item) => cartApi.removeItem(item.courseId))
      );
      await fetchCart();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể xóa các mục đã chọn"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCart = async (): Promise<void> => {
    try {
      setActionLoading(true);
      setError("");
      const res = await cartApi.clearCart();
      setCart(res.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể xóa giỏ hàng"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async (): Promise<void> => {
    if (!selectedItems.length) {
      setError("Vui lòng chọn ít nhất 1 khóa học để thanh toán");
      return;
    }

    try {
      setCheckingOut(true);
      setError("");

      const res = await paymentApi.createSession();
      const checkoutUrl =
        res?.data?.checkoutUrl ||
        res?.data?.data?.checkoutUrl ||
        res?.data?.item?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("Không tạo được link thanh toán");
      }

      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể khởi tạo thanh toán"));
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <CartSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-white/60 bg-white px-5 py-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] md:px-7 md:py-7">
          <div className="absolute inset-y-0 right-0 hidden w-[32%] bg-gradient-to-l from-sky-50 to-transparent lg:block" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Checkout
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-[40px] md:leading-[1.1]">
                Giỏ hàng của bạn
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-[15px]">
                Chọn khóa học cần thanh toán, tăng giảm số lượng trực tiếp và
                tổng tiền sẽ cập nhật ngay theo thời gian thực.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium text-slate-500">
                  Tổng khóa học
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {items.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium text-slate-500">
                  Đã chọn
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {selectedItems.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium text-slate-500">
                  Số lượng
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {displaySummary.totalQuantity}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium text-slate-500">
                  Tạm tính
                </div>
                <div className="mt-1 text-xl font-bold text-sky-700">
                  {formatPrice(displaySummary.totalPrice)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {!items.length ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <ShoppingCart className="h-9 w-9 text-slate-500" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Giỏ hàng đang trống
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Thêm những khóa học bạn quan tâm để bắt đầu thanh toán.
            </p>

            <Link
              href="/danh-muc"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Xem khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="space-y-4">
              <div className="rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAll}
                        disabled={actionLoading}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Chọn tất cả
                    </label>

                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                      {items.length} khóa học
                    </span>

                    <span className="rounded-full bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                      Đã chọn {selectedItems.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      disabled={actionLoading || !selectedItems.length}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Xóa đã chọn
                    </button>

                    <button
                      type="button"
                      onClick={handleClearCart}
                      disabled={actionLoading || !items.length}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>
              </div>

              {items.map((item) => {
                const title = item.course?.title || item.title;
                const image = item.course?.image || item.image || "";
                const status = item.course?.status;
                const isDisabled = updatingId === item.courseId || actionLoading;
                const isUpdating = updatingId === item.courseId;

                return (
                  <article
                    key={item.courseId}
                    className={`group relative overflow-hidden rounded-[30px] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition ${
                      item.isAvailable === false
                        ? "border-rose-100 bg-rose-50/40"
                        : "border-white/70 bg-white hover:-translate-y-[1px]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() =>
                              void handleToggleItem(item.courseId, !item.selected)
                            }
                            disabled={isDisabled || item.isAvailable === false}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </div>

                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-slate-200/60">
                          {image ? (
                            <img
                              src={image}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                                status
                              )}`}
                            >
                              {getStatusLabel(status)}
                            </span>

                            {item.isAvailable === false ? (
                              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">
                                Không khả dụng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                <BadgeCheck className="h-3 w-3" />
                                Có thể thanh toán
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-7 text-slate-900 md:text-[20px]">
                            {title}
                          </h3>

                          <div className="mt-4 flex flex-wrap items-end gap-3">
                            <span className="text-2xl font-bold text-slate-900">
                              {formatPrice(item.unitPrice)}
                            </span>

                            {item.originalPrice > item.unitPrice ? (
                              <span className="pb-0.5 text-sm font-medium text-slate-400 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1.5">
                              Số lượng: {item.quantity}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1.5">
                              Thành tiền: {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 lg:min-w-[220px] lg:items-end">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDecreaseQty(item)}
                            disabled={isDisabled || item.quantity <= 1}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="min-w-[30px] text-center text-sm font-bold text-slate-900">
                            {isUpdating ? (
                              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() => void handleIncreaseQty(item)}
                            disabled={isDisabled}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left lg:min-w-[200px] lg:text-right">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Thành tiền
                          </div>
                          <div className="mt-1 text-2xl font-bold text-slate-900">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleRemoveItem(item.courseId)}
                          disabled={isDisabled}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa khóa học
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="xl:sticky xl:top-6">
              <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="bg-[linear-gradient(135deg,#0f172a_0%,#13294b_55%,#0b63ce_100%)] px-6 pb-6 pt-6 text-white">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        Payment
                      </p>
                      <h2 className="mt-1 text-[28px] font-bold leading-tight">
                        Thanh toán VNPAY
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        Xác nhận đơn hàng và chuyển sang cổng thanh toán an toàn.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <div className="text-xs text-white/65">Đã chọn</div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {displaySummary.totalCourses}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <div className="text-xs text-white/65">Số lượng</div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {displaySummary.totalQuantity}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <SummaryRow
                      label="Tổng giá gốc"
                      value={formatPrice(displaySummary.totalOriginalPrice)}
                    />
                    <div className="my-3 h-px bg-slate-200" />
                    <SummaryRow
                      label="Giảm giá"
                      value={`-${formatPrice(displaySummary.totalDiscount)}`}
                      valueClassName="text-emerald-600"
                    />
                    <div className="my-3 h-px bg-slate-200" />
                    <SummaryRow
                      label="Số khóa học"
                      value={String(displaySummary.totalCourses)}
                    />
                    <div className="my-3 h-px bg-slate-200" />
                    <SummaryRow
                      label="Tổng số lượng"
                      value={String(displaySummary.totalQuantity)}
                    />
                    <div className="my-4 h-px bg-slate-200" />
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-sm text-slate-500">Cần thanh toán</div>
                        <div className="mt-1 text-[30px] font-bold leading-none text-slate-900">
                          {formatPrice(displaySummary.totalPrice)}
                        </div>
                      </div>

                      <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        Bảo mật
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={!selectedItems.length || checkingOut}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b63ce] px-5 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(11,99,206,0.28)] transition hover:translate-y-[-1px] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang chuyển sang VNPAY...
                      </>
                    ) : (
                      <>
                        Thanh toán ngay
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Thanh toán an toàn
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Đơn hàng chỉ được cập nhật sau khi cổng thanh toán xác
                          nhận thành công.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          Tổng tiền tính theo khóa học đã chọn
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-700/80">
                          Bỏ chọn hoặc đổi số lượng ở danh sách bên trái thì phần
                          tiền này sẽ đổi ngay.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/danh-muc"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Xem thêm khóa học
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}