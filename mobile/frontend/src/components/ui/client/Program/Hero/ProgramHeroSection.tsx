"use client";

import Image from "next/image";

export default function ProgramHeroSection() {
  return (
    <section className="w-full bg-[#edf4f8]">
      <div className="mx-auto grid min-h-[320px] w-full max-w-7xl items-center gap-8 px-4 py-6 sm:px-6 md:grid-cols-2 md:gap-10 md:px-8 lg:px-10">
        <div className="flex items-center">
          <div className="max-w-[560px] pl-0 md:pl-4 lg:pl-8">
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-[#0f2343] md:text-[48px] lg:text-[56px]">
              Chương trình học
            </h1>

            <p className="mt-4 max-w-[520px] text-[15px] font-medium leading-7 text-slate-700 md:text-base">
              Hệ thống đào tạo toàn diện, xây dựng nền tảng kiến thức vững chắc
              và phát triển kỹ năng đỉnh cao cho mọi lứa tuổi, giúp học viên
              chinh phục mọi đỉnh cao tri thức.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <button className="inline-flex h-12 items-center justify-center rounded-full bg-[#123d7a] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3264]">
                Nhận tư vấn miễn phí
              </button>

              <button className="inline-flex h-12 items-center justify-center rounded-full border border-[#8fb1ca] bg-white px-6 text-sm font-semibold text-[#123d7a] transition hover:bg-slate-50">
                Xem khóa học
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex h-full items-center justify-end">
          <div className="relative h-[260px] w-full overflow-hidden rounded-[10px] md:h-[320px] lg:h-[360px]">
            <Image
              src="/Program/Hero/learning-program.png"
              alt="Chương trình học"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}