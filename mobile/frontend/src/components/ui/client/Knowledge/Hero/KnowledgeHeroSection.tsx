"use client";

import { Search } from "lucide-react";

export default function KnowledgeHero() {
  return (
    <section className="w-full bg-[#0b4373] px-4 py-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center">
        <h2 className="text-center text-[28px] font-bold leading-tight text-white md:text-[36px]">
          Góc kiến thức
        </h2>

        <p className="mt-2 max-w-3xl text-center text-[13px] text-white/85 md:text-[15px]">
          Chia sẻ kinh nghiệm học tập, phương pháp hiệu quả và định hướng giáo
          dục cho tương lai của bạn.
        </p>

        <form className="mt-5 w-full max-w-[520px]">
          <div className="flex h-[46px] items-center rounded-full bg-white px-4 shadow-md">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm kiến thức..."
              className="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </form>
      </div>
    </section>
  );
}