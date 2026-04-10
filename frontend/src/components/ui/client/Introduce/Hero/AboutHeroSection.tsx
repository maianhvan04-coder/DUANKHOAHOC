"use client";

import Image from "next/image";
import Link from "next/link";

const stats = [
  {
    value: "10.000+",
    label: "Học viên đồng hành",
  },
  {
    value: "95%",
    label: "Hài lòng sau khóa học",
  },
  {
    value: "50+",
    label: "Giảng viên & cố vấn",
  },
];

export default function AboutHeroSection() {
  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-visible rounded-[28px] bg-white">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
            <div className="max-w-xl">
              <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[44px] lg:text-[52px]">
                Everest - Khởi Nguồn
                <br />
                Tri Thức, Kiến Tạo
                <br />
                Tương Lai
              </h1>

              <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-600 md:text-[16px]">
                Sứ mệnh của chúng tôi là trang bị cho thế hệ trẻ những kiến thức
                và kỹ năng cần thiết để dẫn dắt và đạt hiệu suất tối ưu.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/khoa-hoc"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0b4b84] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08365f]"
                >
                  Khám phá khóa học
                </Link>

                <Link
                  href="/lien-he"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Liên hệ tư vấn
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[1.28/1] w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <Image
                  src="/Introduce/Hero/brand-story-main.jpg"
                  alt="Đội ngũ học tập và giảng viên Everest"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}