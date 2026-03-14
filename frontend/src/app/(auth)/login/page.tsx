"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Chrome,
  Facebook,
  ArrowRight,
} from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AuthInput({
  type = "text",
  placeholder,
  icon,
  passwordToggle = false,
}: {
  type?: string;
  placeholder: string;
  icon: ReactNode;
  passwordToggle?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
        {icon}
      </span>

      <input
        type={passwordToggle ? (show ? "text" : "password") : type}
        placeholder={placeholder}
        className={cn(
          "h-[56px] w-full rounded-2xl border bg-white",
          "border-[#E2E8F0] pl-12 pr-12 text-[15px] text-[#0F172A]",
          "outline-none transition-all duration-200",
          "placeholder:text-[#94A3B8]",
          "focus:border-[#2563EB] focus:ring-4 focus:ring-[#DBEAFE]"
        )}
      />

      {passwordToggle && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2",
            "text-[#94A3B8] transition hover:text-[#2563EB]"
          )}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      )}
    </div>
  );
}

function DividerText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[#E2E8F0]" />
      <span className="shrink-0 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
        {text}
      </span>
      <div className="h-px flex-1 bg-[#E2E8F0]" />
    </div>
  );
}

function SocialButton({
  type,
}: {
  type: "google" | "facebook";
}) {
  const isGoogle = type === "google";

  return (
    <button
      type="button"
      className={cn(
        "flex h-[52px] items-center justify-center gap-3 rounded-2xl border bg-white",
        "border-[#E2E8F0] text-[15px] font-semibold text-[#0F172A]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-sm"
      )}
    >
      {isGoogle ? (
        <>
          <Chrome size={18} className="text-[#EA4335]" />
          <span>Google</span>
        </>
      ) : (
        <>
          <Facebook size={18} className="text-[#1877F2]" />
          <span>Facebook</span>
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-9">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563EB,#1D4ED8)] shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
          <Lock size={24} className="text-white" />
        </div>

        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-[#0F172A] md:text-[38px]">
          Đăng nhập
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-[#64748B]">
          Chào mừng bạn quay trở lại. Vui lòng đăng nhập để tiếp tục.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <AuthInput
          placeholder="Email hoặc số điện thoại"
          icon={<Mail size={18} />}
        />
        <AuthInput
          placeholder="Mật khẩu"
          icon={<Lock size={18} />}
          passwordToggle
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 text-[14px] md:flex-row md:items-center md:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-[#334155]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-[#CBD5E1] text-[#2563EB] focus:ring-[#93C5FD]"
          />
          <span className="font-medium">Ghi nhớ đăng nhập</span>
        </label>

        <Link
          href="/quen-mat-khau"
          className="font-semibold text-[#2563EB] transition hover:text-[#1D4ED8]"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <button
        type="button"
        className={cn(
          "mt-7 flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl",
          "bg-[linear-gradient(135deg,#2563EB,#1D4ED8)]",
          "text-[16px] font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]",
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.34)]"
        )}
      >
        <span>Đăng nhập</span>
        <ArrowRight size={18} />
      </button>

      <p className="mt-5 text-center text-[15px] text-[#64748B]">
        Bạn chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-bold text-[#2563EB] transition hover:text-[#1D4ED8]"
        >
          Đăng ký ngay
        </Link>
      </p>

      <div className="mt-7">
        <DividerText text="hoặc tiếp tục với" />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SocialButton type="google" />
        <SocialButton type="facebook" />
      </div>
    </div>
  );
}