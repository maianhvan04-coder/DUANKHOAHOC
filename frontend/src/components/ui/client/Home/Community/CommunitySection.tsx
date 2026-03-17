"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import CommunityImage from "./CommunityGallery";

type CommunityTabKey = "toeic" | "toefl";

type CommunityContent = {
  title: string;
  items: string[];
  buttonText: string;
  buttonHref: string;
  image: string;
  imageAlt: string;
};

const COMMUNITY_DATA: Record<CommunityTabKey, CommunityContent> = {
  toeic: {
    title: "Cộng đồng luyện thi TOEIC chính thống duy nhất của IIG Việt Nam",
    items: [
      "Cập nhật thông tin mới nhất về kỳ thi và xu hướng ra đề TOEIC",
      "Kết nối hàng ngàn học viên có cùng mục tiêu chinh phục điểm cao",
      "Đồng hành cùng đội ngũ giáo viên và các học viên xuất sắc",
      "Hỗ trợ giải đáp mọi thắc mắc học tập từ cơ bản đến nâng cao",
      "Quyền lợi đặc biệt dành riêng cho thành viên cộng đồng hihi",
    ],
    buttonText: "Kết nối ngay",
    buttonHref: "/",
    image: "/home/community/community-toeic.png",
    imageAlt: "Cộng đồng TOEIC",
  },
  toefl: {
    title: "Không gian kết nối dành cho học viên TOEFL học tập bài bản và hiệu quả",
    items: [
      "Cập nhật nhanh thông tin mới về kỳ thi TOEFL và định hướng ôn luyện",
      "Kết nối học viên cùng mục tiêu nâng cao năng lực tiếng Anh học thuật",
      "Trao đổi kinh nghiệm học tập, tài liệu và chiến lược làm bài",
      "Nhận hỗ trợ từ đội ngũ giảng viên và cộng đồng học viên tích cực",
      "Nhiều quyền lợi và hoạt động riêng dành cho thành viên cộng đồng",
    ],
    buttonText: "Tham gia ngay",
    buttonHref: "/",
    image: "/home/community/community-toefl.png",
    imageAlt: "Cộng đồng TOEFL",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CommunitySection() {
  const [activeTab, setActiveTab] = useState<CommunityTabKey>("toeic");

  const current = useMemo(() => COMMUNITY_DATA[activeTab], [activeTab]);

  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Cộng đồng Everest E-learning</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Left */}
          <div>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("toeic")}
                className={cn(
                  "inline-flex h-15.5 min-w-57.5 items-center justify-center rounded-xl border px-7 text-[16px] font-bold transition",
                  activeTab === "toeic"
                    ? "border-[#0D56A6] bg-[#EAF1F8] text-[#0D56A6]"
                    : "border-[#D9DDE3] bg-white text-[#032654] hover:border-[#0D56A6]/40"
                )}
              >
                Cộng đồng TOEIC
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("toefl")}
                className={cn(
                  "inline-flex h-15.5 min-w-57.5 items-center justify-center rounded-xl border px-7 text-[16px] font-bold transition",
                  activeTab === "toefl"
                    ? "border-[#0D56A6] bg-[#EAF1F8] text-[#0D56A6]"
                    : "border-[#D9DDE3] bg-white text-[#032654] hover:border-[#0D56A6]/40"
                )}
              >
                Cộng đồng TOEFL
              </button>
            </div>

            <div className="mt-10">

              <div className="mt-8 space-y-6">
                {current.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#032654]" />
                    <p className="text-[18px] font-semibold leading-[1.3] text-[#032654] md:text-[20px]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={current.buttonHref}
                className="mt-10 inline-flex h-[48] items-center justify-center rounded-lg bg-[#0D56A6] px-7 text-[14px] font-bold text-white transition hover:bg-[#0A478A]"
              >
                {current.buttonText}
              </Link>
            </div>
          </div>

          {/* Right: 1 ảnh tổng */}
          <CommunityImage src={current.image} alt={current.imageAlt} />
        </div>
      </div>
    </section>
  );
}