"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AuthInput({
  type = "text",
  placeholder,
  passwordToggle = false,
}: {
  type?: string;
  placeholder: string;
  passwordToggle?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={passwordToggle ? (show ? "text" : "password") : type}
        placeholder={placeholder}
        className="h-[54px] w-full rounded-[12px] border border-[#D9D9D9] bg-white px-5 pr-12 text-[16px] text-[#1F2937] outline-none transition placeholder:text-[#BDBDBD] focus:border-[#0D56A6]"
      />

      {passwordToggle && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] transition hover:text-[#6B7280]"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}

function DividerText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[#D9D9D9]" />
      <span className="shrink-0 text-[18px] font-semibold text-[#0D56A6]">
        {text}
      </span>
      <div className="h-px flex-1 bg-[#D9D9D9]" />
    </div>
  );
}

function SocialButton({
  type,
  filled = false,
}: {
  type: "google" | "facebook";
  filled?: boolean;
}) {
  const isGoogle = type === "google";

  return (
    <button
      type="button"
      className={cn(
        "flex h-[46px] items-center justify-center gap-3 rounded-[10px] border text-[18px] font-semibold transition",
        filled
          ? "border-[#0D56A6] bg-[#0D56A6] text-white hover:bg-[#0A4A91]"
          : "border-[#D9D9D9] bg-white text-[#2C2C2C] hover:bg-[#F8FAFC]"
      )}
    >
      {isGoogle ? (
        <>
          <span className="text-[24px] font-bold leading-none text-[#EA4335]">
            G
          </span>
          <span>GOOGLE</span>
        </>
      ) : (
        <>
          <span className="text-[24px] font-bold leading-none">f</span>
          <span>FACEBOOK</span>
        </>
      )}
    </button>
  );
}

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-10 text-center text-[34px] font-extrabold uppercase tracking-[1px] text-[#0D56A6] md:text-[42px]">
        Thông tin đăng ký
      </h1>

      <div className="space-y-5">
        <AuthInput placeholder="Họ và tên" />
        <AuthInput placeholder="Email" type="email" />
        <AuthInput placeholder="Số điện thoại" />
        <AuthInput placeholder="Mật khẩu" passwordToggle />
        <AuthInput placeholder="Nhập lại mật khẩu" passwordToggle />
      </div>

      <button
        type="button"
        className="mt-8 h-[48px] w-full rounded-[10px] bg-[#5DA745] text-[18px] font-bold text-white transition hover:bg-[#4E9238]"
      >
        Đăng ký
      </button>

      <p className="mt-4 text-[16px] text-[#6E6E6E] md:text-[18px]">
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className="font-bold text-[#0D56A6]">
          Đăng nhập ngay
        </Link>
      </p>

      <div className="mt-10">
        <DividerText text="Đăng nhập với" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SocialButton type="google" />
        <SocialButton type="facebook" filled />
      </div>
    </>
  );
}