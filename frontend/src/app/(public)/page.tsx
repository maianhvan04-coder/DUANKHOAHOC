import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Flame, GraduationCap, Medal, Quote, Trophy } from "lucide-react";

import HomeCategoryPanel from "@/components/ui/client/Home/CategoryPanel/HomeCategoryPanel";
import HomeCourseSections from "@/components/ui/client/Home/Courses/HomeCourseSections";
import HomeHeroBanner from "@/components/ui/client/Home/Hero/HomeHeroBanner";

export const metadata: Metadata = {
  title: "Everest - Học tập hiệu quả",
  description:
    "Khám phá các khóa học chất lượng cao, phát triển kỹ năng và đạt mục tiêu học tập cùng Everest.",
};

const newsItems = [
  "Everest cập nhật lộ trình học trực tuyến cho năm học mới",
  "5 kỹ năng giúp học sinh học online chủ động và hiệu quả hơn",
  "Lịch khai giảng các lớp tiếng Anh, tin học và luyện thi chứng chỉ",
];

function SidePromo() {
  return (
    <aside className="flex h-full flex-col justify-between gap-5 rounded-[4px] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.16)]">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[4px] bg-[linear-gradient(160deg,#0537bd,#0da6ff)]">
        <Image
          src="/hero/channels4_profile.jpg"
          alt="Ưu đãi khóa học Everest"
          fill
          sizes="(max-width: 768px) 100vw, 306px"
          className="object-cover object-center"
        />
      </div>

      <Link
        href="/#khoa-hoc"
        className="flex h-[52px] shrink-0 items-center justify-center rounded-[4px] bg-[#0D6EAF] px-4 text-center text-sm font-black uppercase text-white transition hover:bg-[#0B5F98] lg:h-[60px] lg:text-base"
      >
        Đăng kí ngay
      </Link>
    </aside>
  );
}

function StatsBand() {
  const stats = [
    { icon: Trophy, value: "19 năm", label: "Giáo dục trực tuyến" },
    { icon: GraduationCap, value: "8.050.111", label: "Thành viên" },
    {
      icon: Medal,
      value: "Nền tảng học trực tuyến",
      label: "số 1 Việt Nam",
    },
  ];

  return (
    <section className="relative mx-auto grid overflow-hidden rounded-[4px] bg-[linear-gradient(135deg,#04bceb_0%,#0087f0_48%,#0064d8_100%)] text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] md:grid-cols-3">
      <span className="pointer-events-none absolute -left-12 top-0 h-full w-[42%] skew-x-[-28deg] bg-white/8" />
      <span className="pointer-events-none absolute right-0 top-0 h-full w-[35%] skew-x-[-28deg] bg-[#0046bd]/25" />

      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="relative z-10 flex min-h-[110px] items-center justify-center gap-5 px-5 lg:min-h-[138px]"
          >
            <Icon className="h-12 w-12 shrink-0 stroke-[1.7] text-white/90 lg:h-16 lg:w-16" />

            <div>
              <p className="text-[22px] font-black leading-7 lg:text-[24px]">
                {item.value}
              </p>
              <p className="text-base font-bold leading-6 lg:text-lg">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function StudentShareCard() {
  return (
    <div className="min-h-[275px] rounded-[4px] border border-slate-200 bg-white p-6 shadow-[0_3px_12px_rgba(15,23,42,0.16)]">
      <div className="flex gap-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#eaf5ff]">
          <Image
            src="/home/students/student-2.png"
            alt="Học viên Everest"
            fill
            sizes="96px"
            className="object-cover"
          />
          <span className="absolute left-0 top-0 h-full w-8 bg-[#0D8DFF]" />
        </div>

        <div className="min-w-0 pt-2">
          <p className="text-base font-bold text-[#0D56A6]">
            Nguyễn Xuân Duy Thắng
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tài khoản everest.vn: duythangnx***
            <br />
            96.49 điểm ĐGTD - Thủ khoa ĐGTD đợt 1 năm 2023
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-3 text-slate-500">
        <Quote className="mt-1 h-9 w-9 shrink-0 fill-slate-300 text-slate-300" />
        <p className="line-clamp-3 text-sm leading-6">
          Đề thi ĐGTD khó và có sự thay đổi so với các năm trước nên em cần
          được định hướng hỗ trợ ôn luyện, Everest là nơi giúp em học chắc từng
          phần.
        </p>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === 7 ? "bg-[#0D8DFF]" : "bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function EducationNewsCard() {
  return (
    <div className="min-h-[275px] rounded-[4px] border border-slate-200 bg-white p-6 shadow-[0_3px_12px_rgba(15,23,42,0.16)]">
      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <Link href="/" className="group block">
          <div className="relative h-40 overflow-hidden rounded-[2px] bg-slate-100">
            <Image
              src="/teacher/post-1.png"
              alt="Tin tức giáo dục Everest"
              fill
              sizes="260px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-7 text-slate-800 group-hover:text-[#0D56A6]">
            Everest đại diện EdTech Việt Nam chia sẻ về giáo dục trực tuyến
          </h3>
        </Link>

        <ul className="space-y-4 pt-2 text-sm leading-6 text-slate-700">
          {newsItems.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D8DFF]" />
              <Link href="/" className="hover:text-[#0D56A6]">
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ShareAndNewsSection() {
  return (
    <section className="border-t border-slate-100 bg-white px-4 pb-12 pt-2">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-800">
            Lắng nghe và chia sẻ
          </h2>
          <StudentShareCard />
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-800">
            Các tin tức giáo dục
          </h2>
          <EducationNewsCard />
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <section className="bg-[linear-gradient(135deg,#dff4ff_0%,#a8d1ff_54%,#89aef5_100%)] pb-[86px] lg:pb-[94px]">
        <div className="relative z-10 h-14 overflow-hidden bg-[#9b7f89]">
          <div className="mx-auto grid h-full max-w-[1240px] grid-cols-1 items-center px-4 md:grid-cols-[240px_minmax(0,1fr)_200px] md:gap-6 md:px-6 lg:grid-cols-[290px_minmax(0,1fr)_240px] xl:grid-cols-[300px_minmax(0,1fr)_250px]">
            <div className="hidden md:block" />

            <div className="relative flex h-full min-w-0 items-center gap-3 md:col-span-2">
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-600">
                <Flame className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              </span>

              <p className="relative z-10 line-clamp-1 text-xs font-bold text-white lg:text-sm">
                BÙNG NỔ - HOCMAI CHÍNH THỨC MỞ ĐĂNG KÝ KHÓA TOPUNI XUẤT PHÁT
                SỚM CHO 2K9 &gt;&gt; Đăng ký ngay
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-30 mx-auto max-w-[1240px] px-4 pt-10 md:px-6 md:pt-8">
          <div className="grid items-start gap-4 md:grid-cols-[240px_minmax(0,1fr)_200px] md:gap-6 lg:grid-cols-[290px_minmax(0,1fr)_240px] xl:grid-cols-[300px_minmax(0,1fr)_250px]">
            <div className="relative z-50 -mt-20 overflow-hidden rounded-[4px] bg-[#f1f3f6] shadow-[0_4px_16px_rgba(15,23,42,0.12)] md:-mt-[80px]">
              <HomeCategoryPanel />
            </div>

            <div className="[&>section]:h-[240px] md:[&>section]:h-[320px] lg:[&>section]:h-[420px]">
              <HomeHeroBanner />
            </div>

            <div className="[&>aside]:min-h-[240px] md:[&>aside]:min-h-[320px] lg:[&>aside]:min-h-[420px]">
              <SidePromo />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <div className="relative z-20 -mb-[55px] -translate-y-[55px] lg:-mb-[69px] lg:-translate-y-[69px]">
          <div className="mx-auto max-w-[1240px] px-4 md:px-6">
            <StatsBand />
          </div>
        </div>

        <HomeCourseSections />
      </div>

      <ShareAndNewsSection />
    </main>
  );
}
