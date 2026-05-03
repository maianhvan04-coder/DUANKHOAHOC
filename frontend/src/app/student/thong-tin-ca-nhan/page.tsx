"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { Toaster, toast } from "sonner";
import { accountApi } from "@/app/api/account.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { useStudentPreferences, type StudentLocale } from "@/i18n";

const copy = {
  vi: {
    save: "Lưu thay đổi",
    saving: "Đang lưu...",
    title: "Thông tin tài khoản",
    description: "Xem và cập nhật thông tin cá nhân của bạn.",
    avatar: "Ảnh đại diện",
    avatarHint: "JPG, PNG hoặc WEBP",
    fullName: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên",
    email: "Email",
    primaryRole: "Vai trò chính",
    success: "Cập nhật thông tin thành công",
    error: "Cập nhật thông tin thất bại",
  },
  en: {
    save: "Save changes",
    saving: "Saving...",
    title: "Account information",
    description: "View and update your personal information.",
    avatar: "Avatar",
    avatarHint: "JPG, PNG or WEBP",
    fullName: "Full name",
    fullNamePlaceholder: "Enter full name",
    email: "Email",
    primaryRole: "Primary role",
    success: "Profile updated successfully",
    error: "Failed to update profile",
  },
} as const satisfies Record<StudentLocale, Record<string, string>>;

type ApiErrorResponse = {
  message?: string;
};

type ErrorWithResponse = {
  response?: {
    data?: ApiErrorResponse;
  };
};

function isErrorWithResponse(error: unknown): error is ErrorWithResponse {
  if (typeof error !== "object" || error === null) return false;
  return "response" in error;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isErrorWithResponse(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
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

  if (avatar.startsWith("/")) return `${origin}${avatar}`;

  return `${origin}/${avatar}`;
}

export default function StudentProfilePage() {
  const { user, access, refreshMe } = useAuth();
  const { locale } = useStudentPreferences();
  const text = copy[locale];

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const name = nameDraft ?? user?.name ?? "";
  const email = user?.email ?? "";
  const role = access?.primaryRole ?? "STUDENT";
  const avatarUrl = avatarPreview ?? resolveAvatarUrl(user?.avatar);

  const initials = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "HV";

    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [name]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);

    try {
      const result = await accountApi.updateProfile({
        name: name.trim(),
        avatar: selectedFile,
      });

      toast.success(result.message || text.success);
      setSelectedFile(null);
      setSelectedFileName("");
      await refreshMe();
    } catch (error) {
      toast.error(getErrorMessage(error, text.error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="p-4 md:p-6">
      <Toaster richColors position="top-right" />

      <section className="border border-[#cbe7fb] bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="border-b border-[#cbe7fb] bg-[#0D56A6] px-5 py-4 text-white md:px-7 dark:border-white/10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {text.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            {text.description}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 p-5 md:p-6 lg:grid-cols-[350px_minmax(0,1fr)]"
        >
          <div className="rounded-2xl border border-[#cbe7fb] bg-[#F8FCFF] p-6 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <div className="relative">
                {avatarUrl ? (
                  <span
                    aria-label={name || text.avatar}
                    role="img"
                    className="block h-36 w-36 rounded-full bg-cover bg-center ring-4 ring-white shadow-sm dark:ring-slate-900"
                    style={{ backgroundImage: `url("${avatarUrl}")` }}
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[#0D56A6] text-3xl font-black text-white ring-4 ring-white shadow-sm dark:ring-slate-900">
                    {initials}
                  </div>
                )}

                <label
                  htmlFor="student-avatar-upload"
                  className="absolute bottom-2 right-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-[#0D56A6] shadow-md ring-1 ring-[#cbe7fb] transition hover:bg-[#F4FAFF] dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/10"
                  aria-label={text.avatar}
                >
                  <Camera className="h-5 w-5" />
                </label>

                <input
                  id="student-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <p className="mt-5 text-base font-bold text-slate-950 dark:text-slate-100">
                {text.avatar}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {text.avatarHint}
              </p>

              {selectedFileName ? (
                <p className="mt-3 max-w-full truncate text-xs text-slate-500 dark:text-slate-400">
                  {selectedFileName}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-[#cbe7fb] bg-white p-6 dark:border-white/10 dark:bg-slate-950/30">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {text.fullName}
                </span>
                <input
                  value={name}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder={text.fullNamePlaceholder}
                  className="h-14 w-full rounded-xl border border-[#cbe7fb] bg-white px-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0D56A6] focus:ring-4 focus:ring-[#0D56A6]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <ReadOnlyField label={text.email} value={email} type="email" />
              <ReadOnlyField label={text.primaryRole} value={role} />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-14 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#0D56A6] px-6 text-sm font-bold text-white transition hover:bg-[#0B4B92] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? text.saving : text.save}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function ReadOnlyField({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: "email" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        type={type}
        value={value}
        readOnly
        className="h-14 w-full rounded-xl border border-[#cbe7fb] bg-[#F8FCFF] px-5 text-sm font-semibold text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      />
    </label>
  );
}
