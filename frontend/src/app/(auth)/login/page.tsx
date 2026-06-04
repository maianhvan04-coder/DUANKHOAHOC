"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { authApi } from "@/app/api/auth.api";
import {
  markAdminIntroIntent,
  setAccess,
  setToken,
  setUser,
} from "@/lib/utils/storage";
import {
  getStudentEntryPath,
  getTeacherEntryPath,
  getAdminEntryPath,
} from "@/lib/helpers/auth/access";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getSafeRedirectPath(): string | null {
  if (typeof window === "undefined") return null;

  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }

  return redirect;
}

function Logo() {
  return (
    <Link href="/" className="mx-auto block w-fit lg:mx-0">
      <Image
        src="/Logo-horizontal-clean.png"
        alt="Everest"
        width={286}
        height={64}
        priority
        className="h-auto w-[286px] max-w-full object-contain"
      />
    </Link>
  );
}

function AuthTabs({ active }: { active: "login" | "register" }) {
  return (
    <div className="mt-8 grid grid-cols-2 border-b border-slate-200 text-center">
      <Link
        href="/login"
        className={cn(
          "pb-3 text-[14px] transition",
          active === "login"
            ? "border-b-2 border-[#0b2f6c] font-semibold text-slate-800"
            : "font-medium text-slate-400 hover:text-slate-600"
        )}
      >
        Đăng nhập
      </Link>

      <Link
        href="/register"
        className={cn(
          "pb-3 text-[14px] transition",
          active === "register"
            ? "border-b-2 border-[#0b2f6c] font-semibold text-slate-800"
            : "font-medium text-slate-400 hover:text-slate-600"
        )}
      >
        Đăng ký
      </Link>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  rightSlot,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className="h-[42px] w-full rounded-[6px] border border-slate-300 bg-[#eef3fb] px-3 pr-10 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0b2f6c] focus:bg-white"
        />

        {rightSlot ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[12px] uppercase tracking-[0.18em] text-slate-400">
        OR
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function SocialButton({
  type,
}: {
  type: "google" | "facebook";
  text: string;
}) {
  if (type === "facebook") return null;

  return (
    <button
      type="button"
      className="flex h-16 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 text-[18px] font-semibold text-slate-900 transition hover:bg-slate-50"
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 13.9A6.01 6.01 0 0 1 6.08 12c0-.66.11-1.3.32-1.9V7.51H3.05A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.49L6.4 13.9Z" />
        <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.51 3.84 1.5l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.95 5.51L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z" />
      </svg>
      <span>Tiếp tục với Google</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");

    if (!form.email.trim() || !form.password.trim()) {
      setErr("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const res = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      setToken(res.accessToken);
      setUser(res.user);
      setAccess(res.access);

      const teacherEntryPath = getTeacherEntryPath(res.access);
      const studentEntryPath = getStudentEntryPath(res.access);
      const adminEntryPath = getAdminEntryPath(res.access);
      const redirectPath = getSafeRedirectPath();
      const nextPath =
        redirectPath ??
        (teacherEntryPath ?? (adminEntryPath ?? (studentEntryPath ?? "/")));

      if (nextPath.startsWith("/admin")) {
        markAdminIntroIntent();
      }

      router.push(nextPath);
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErr(
          (error.response?.data as { message?: string } | undefined)?.message ||
            error.message ||
            "Đăng nhập thất bại"
        );
      } else {
        setErr("Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Logo />
      <AuthTabs active="login" />

      <form onSubmit={onSubmit} className="mt-5">
        <div className="space-y-4">
          <Field
            label="Email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            type="email"
          />

          <div>
            <Field
              label="Mật khẩu"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Mật khẩu"
              type={showPassword ? "text" : "password"}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="inline-flex items-center justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            <div className="mt-2 text-right">
              <Link
                href="/quen-mat-khau"
                className="text-[13px] text-slate-500 transition hover:text-[#0b2f6c]"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 h-[42px] w-full rounded-[6px] bg-[#0b2f6c] text-[14px] font-semibold text-white transition hover:bg-[#08275a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <Divider />

      <div className="space-y-3">
        <SocialButton type="google" text="Tiếp tục với Google" />
        <SocialButton type="facebook" text="Tiếp tục với Facebook" />
      </div>
    </div>
  );
}
