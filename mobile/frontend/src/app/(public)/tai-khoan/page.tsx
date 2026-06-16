"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  CreditCard,
  KeyRound,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  accountApi,
  type PaymentHistoryItem,
  type PaymentProvider,
  type PaymentStatus,
} from "@/app/api/account.api";

type AccountTab = "profile" | "password" | "payments";

type ApiErrorResponse = {
  message?: string;
};

type ErrorWithResponse = {
  response?: {
    data?: ApiErrorResponse;
  };
};

type TabItem = {
  key: AccountTab;
  label: string;
  icon: LucideIcon;
};

type ProfileSectionProps = {
  initialName: string;
  email: string;
  role: string;
  avatar?: string | null;
  onProfileUpdated?: () => Promise<void>;
};

type PaymentHistorySectionProps = {
  payments: PaymentHistoryItem[];
  loading?: boolean;
};

function isErrorWithResponse(error: unknown): error is ErrorWithResponse {
  if (typeof error !== "object" || error === null) return false;
  return "response" in error;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isErrorWithResponse(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Đã thanh toán";
    case "PENDING":
      return "Đang chờ";
    case "FAILED":
      return "Thất bại";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function getStatusClass(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getProviderLabel(provider: PaymentProvider): string {
  switch (provider) {
    case "vnpay":
      return "VNPAY";
    case "payos":
      return "PayOS";
    default:
      return provider;
  }
}

function getApiOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  if (!base) return "";

  return base.replace(/\/api\/?$/, "");
}

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const origin = getApiOrigin();
  if (!origin) return avatar;

  if (avatar.startsWith("/")) {
    return `${origin}${avatar}`;
  }

  return `${origin}/${avatar}`;
}

export default function AccountPage() {
  const { user, access, hydrated, isLoading, refreshMe } = useAuth();

  const [tab, setTab] = useState<AccountTab>("profile");
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);

  const tabs = useMemo<TabItem[]>(
    () => [
      { key: "profile", label: "Thông tin tài khoản", icon: User },
      { key: "password", label: "Đổi mật khẩu", icon: KeyRound },
      { key: "payments", label: "Lịch sử thanh toán", icon: CreditCard },
    ],
    []
  );

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadPayments = async () => {
      setPaymentsLoading(true);

      try {
        const items = await accountApi.getMyPayments();
        if (isMounted) {
          setPayments(items);
        }
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, "Không tải được lịch sử thanh toán")
        );
      } finally {
        if (isMounted) {
          setPaymentsLoading(false);
        }
      }
    };

    void loadPayments();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải tài khoản...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Bạn chưa đăng nhập
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng đăng nhập để xem thông tin tài khoản.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Trang tài khoản
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Xin chào, {user.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              <div>
                <p className="text-xs text-slate-500">Vai trò hiện tại</p>
                <p className="text-sm font-semibold text-slate-900">
                  {access?.primaryRole ?? "USER"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 px-3 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Quản lý tài khoản
            </div>

            <div className="space-y-2">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {tab === "profile" && (
              <ProfileSection
                initialName={user.name}
                email={user.email}
                role={access?.primaryRole ?? "USER"}
                avatar={user.avatar}
                onProfileUpdated={refreshMe}
              />
            )}

            {tab === "password" && <ChangePasswordSection />}

            {tab === "payments" && (
              <PaymentHistorySection
                payments={payments}
                loading={paymentsLoading}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  initialName,
  email,
  role,
  avatar,
  onProfileUpdated,
}: ProfileSectionProps) {
  const avatarFromServer = resolveAvatarUrl(avatar);

  const [name, setName] = useState<string>(initialName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    avatarFromServer
  );
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (!selectedFile) {
      setAvatarPreview(avatarFromServer);
    }
  }, [avatarFromServer, selectedFile]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const initials = useMemo(() => {
    const trimmed = name.trim();

    if (!trimmed) return "U";

    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [name]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);

    try {
      const result = await accountApi.updateProfile({
        name: name.trim(),
        avatar: selectedFile,
      });

      toast.success(result.message || "Cập nhật thông tin thành công");
      setSelectedFile(null);
      setSelectedFileName("");
      await onProfileUpdated?.();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Cập nhật thông tin thất bại")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Thông tin tài khoản</h2>
      <p className="mt-1 text-sm text-slate-500">
        Xem và cập nhật thông tin cá nhân của bạn.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white ring-4 ring-white shadow-sm">
                  {initials}
                </div>
              )}

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-1 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Camera className="h-5 w-5" />
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-900">
              Ảnh đại diện
            </p>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG hoặc WEBP</p>

            {selectedFileName ? (
              <p className="mt-3 max-w-full truncate text-xs text-slate-500">
                {selectedFileName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vai trò chính
              </label>
              <input
                type="text"
                value={role}
                readOnly
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const result = await accountApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(result.message || "Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Đổi mật khẩu thất bại")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cập nhật mật khẩu để tăng bảo mật cho tài khoản.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );
}

function PaymentHistorySection({
  payments,
  loading = false,
}: PaymentHistorySectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Lịch sử thanh toán</h2>
      <p className="mt-1 text-sm text-slate-500">
        Theo dõi các giao dịch thanh toán gần đây của bạn.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <div>Mã đơn</div>
          <div>Cổng thanh toán</div>
          <div>Số tiền</div>
          <div>Trạng thái</div>
          <div>Thời gian</div>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Đang tải lịch sử thanh toán...
            </div>
          ) : payments.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Chưa có lịch sử thanh toán
            </div>
          ) : (
            payments.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] md:items-center"
              >
                <div>
                  <p className="text-xs text-slate-400 md:hidden">Mã đơn</p>
                  <p className="font-semibold text-slate-900">#{item.code}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 md:hidden">
                    Cổng thanh toán
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {getProviderLabel(item.provider)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 md:hidden">Số tiền</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatPrice(item.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 md:hidden">Trạng thái</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 md:hidden">Thời gian</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}