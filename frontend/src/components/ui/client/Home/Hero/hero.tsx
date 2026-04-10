"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function Hero() {
  return (
    <section className="relative min-h-180 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/hero/hero_banner.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 bg-white/10" />

      <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[1380px] grid-cols-[1fr_1fr] items-center gap-8 px-6 py-10 lg:px-10">
        <div />

        <div className="relative z-10 flex justify-end pr-4 lg:pr-10 xl:pr-16">
          <div className="w-full max-w-[410px] rounded-[20px] bg-white px-5 pb-5 pt-5 shadow-[0_12px_30px_rgba(0,0,0,0.10)]">
            <h2 className="text-[24px] font-extrabold leading-tight text-[#202938]">
              Đăng ký nhận tư vấn miễn phí!
            </h2>

            <div className="mt-4 space-y-3">
              <FormInput placeholder="Họ và tên" />
              <FormInput placeholder="Email" />
              <FormInput placeholder="Số điện thoại" />
            </div>

            <button
              type="button"
              className={cn(
                "mt-4 flex h-[42px] w-full items-center justify-center rounded-full",
                "bg-[#0A2F73] text-[16px] font-extrabold text-white",
                "transition hover:brightness-95"
              )}
            >
              GỬI NGAY
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[42px] w-full items-center rounded-[8px] border border-[#D9D9D9] bg-white px-3 text-[14px] text-[#6B7280]">
      <input
        type="text"
        placeholder={placeholder}
        className="h-full w-full bg-transparent outline-none placeholder:text-[#9CA3AF]"
      />
    </div>
  );
}