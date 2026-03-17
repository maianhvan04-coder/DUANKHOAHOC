"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden">
      {/* BG IMAGE */}
      <div className="absolute inset-0">
        <Image
          src="/hero/bg_banner.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* overlay nhẹ nếu cần nhìn form rõ hơn */}
      <div className="absolute inset-0 bg-white/10" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[1280px] grid-cols-[1.05fr_0.95fr] items-center gap-8 px-6 py-10 lg:px-10">
        {/* LEFT */}
        <div className="relative flex items-center justify-center">
          <div className="relative h-[560px] w-full max-w-[620px]">
            <Image
              src="/hero/img_banner.webp"
              alt="Mascot"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="relative z-10 flex justify-center lg:justify-end">
          <div className="w-full max-w-[520px] rounded-[28px] bg-white px-9 pb-9 pt-10 shadow-[0_18px_40px_rgba(0,0,0,0.10)]">
            <h2 className="text-[24px] font-extrabold leading-tight text-[#202938] lg:text-[28px]">
              Nhận tư vấn <span className="text-[#3F63D6]">miễn phí</span>
            </h2>

            <div className="mt-8 space-y-6">
              <FormInput placeholder="Họ tên" />
              <FormInput placeholder="Số điện thoại" />
              <FormSelect placeholder="Chọn cơ sở gần nhất" />
              <FormSelect placeholder="Bạn là?" />
            </div>

            <button
              type="button"
              className={cn(
                "mt-8 flex h-[68px] w-full items-center justify-center rounded-[16px]",
                "bg-[#DE1B24] text-[22px] font-extrabold text-white",
                "transition hover:brightness-95"
              )}
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[60px] w-full items-center rounded-[14px] bg-[#F3F4F6] px-4 text-[18px] text-[#9CA3AF]">
      <input
        type="text"
        placeholder={placeholder}
        className="h-full w-full bg-transparent outline-none placeholder:text-[#A7ADB7]"
      />
    </div>
  );
}

function FormSelect({ placeholder }: { placeholder: string }) {
  return (
    <button
      type="button"
      className="flex h-[60px] w-full items-center justify-between rounded-[14px] bg-[#F3F4F6] px-4 text-left text-[18px] text-[#9CA3AF]"
    >
      <span>{placeholder}</span>
      <ChevronDown className="h-5 w-5 text-[#222]" strokeWidth={2.5} />
    </button>
  );
}