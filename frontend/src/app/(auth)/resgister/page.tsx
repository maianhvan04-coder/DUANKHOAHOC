"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { authApi } from "@/app/api/auth.api";
import { setAccess, setToken, setUser } from "@/lib/utils/storage";
import { hasRole } from "@/lib/helpers/auth/access";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AuthInput({
  type = "text",
  placeholder,
  passwordToggle = false,
  name,
  value,
  onChange,
}: {
  type?: string;
  placeholder: string;
  passwordToggle?: boolean;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={passwordToggle ? (show ? "text" : "password") : type}
        placeholder={placeholder}
        className="h-[54px] w-full rounded-[12px] border border-[#D9D9D9] bg-white px-5 pr-12 text-[16px] text-[#1F2937] outline-none transition placeholder:text-[#BDBDBD] focus:border-[#0D56A6]"
      />

      {passwordToggle && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] transition hover:text-[#6B7280]"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim()
    ) {
      setErr("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErr("Mật khẩu nhập lại không khớp.");
      return;
    }

    if (form.password.length < 6) {
      setErr("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);

      const res = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setToken(res.accessToken);
      setUser(res.user);
      setAccess(res.access);

      const goAdmin =
        hasRole(res.access, "ADMIN") || hasRole(res.access, "MANAGER");

      router.push(goAdmin ? "/admin" : "/");
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErr(
          (error.response?.data as { message?: string } | undefined)?.message ||
            error.message ||
            "Đăng ký thất bại"
        );
      } else {
        setErr("Đăng ký thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="mb-10 text-center text-[34px] font-extrabold uppercase tracking-[1px] text-[#0D56A6] md:text-[42px]">
        Thông tin đăng ký
      </h1>

      <form onSubmit={onSubmit}>
        <div className="space-y-5">
          <AuthInput
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Họ và tên"
          />
          <AuthInput
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            type="email"
          />
          <AuthInput
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="Số điện thoại"
          />
          <AuthInput
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Mật khẩu"
            passwordToggle
          />
          <AuthInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Nhập lại mật khẩu"
            passwordToggle
          />
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 h-[48px] w-full rounded-[10px] bg-[#5DA745] text-[18px] font-bold text-white transition hover:bg-[#4E9238] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>

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