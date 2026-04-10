"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

type Category =
  | "Tất cả"
  | "Ngoại ngữ"
  | "Toán học"
  | "Lập trình"
  | "Kỹ năng"
  | "Luyện thi";

type ProgramItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  category: Exclude<Category, "Tất cả">;
  bullets: string[];
};

const CATEGORIES: Category[] = [
  "Tất cả",
  "Ngoại ngữ",
  "Toán học",
  "Lập trình",
  "Kỹ năng",
  "Luyện thi",
];

const PROGRAMS: ProgramItem[] = [
  {
    id: 1,
    title: "Toán Tư Duy (Mầm non - Tiểu học)",
    description:
      "Phát triển tư duy logic, khả năng giải quyết vấn đề thông qua các hoạt động thú vị.",
    image: "/Program/Catalog/math-thinking.jpg",
    category: "Toán học",
    bullets: [
      "Giáo trình chuẩn quốc tế",
      "Học mà chơi, chơi mà học",
      "Đội ngũ giáo viên tâm huyết",
    ],
  },
  {
    id: 2,
    title: "Tiếng Anh Giao Tiếp (Thiếu niên - Người lớn)",
    description:
      "Nâng cao kỹ năng nghe, nói, tự tin giao tiếp trong môi trường quốc tế.",
    image: "/Program/Catalog/english-speaking.jpg",
    category: "Ngoại ngữ",
    bullets: [
      "Lộ trình cá nhân hóa",
      "Môi trường 100% tiếng Anh",
      "Chứng chỉ uy tín",
    ],
  },
  {
    id: 3,
    title: "Lập Trình Căn Bản (Mọi lứa tuổi)",
    description:
      "Khám phá thế giới công nghệ, nắm vững nền tảng lập trình từ con số 0.",
    image: "/Program/Catalog/programming-basic.png",
    category: "Lập trình",
    bullets: [
      "Ngôn ngữ phổ biến Python/Java",
      "Dự án thực tế",
      "Hỗ trợ kỹ thuật liên tục",
    ],
  },
];

function ProgramCard({ item }: { item: ProgramItem }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,35,67,0.08)]">
      <div className="px-4 pt-4">
        <div className="relative h-[180px] w-full overflow-hidden rounded-[14px]">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      </div>

      <div className="px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 min-h-[64px] text-[18px] font-bold leading-[1.3] tracking-[-0.02em] text-[#13233f]">
          {item.title}
        </h3>

        <p className="mt-3 min-h-[72px] text-[14px] leading-6 text-slate-600">
          {item.description}
        </p>

        <ul className="mt-4 space-y-2.5">
          {item.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2.5 text-[14px] leading-6 text-slate-700"
            >
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#8db6c7]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <button className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-[#a4c4d2] bg-white text-[15px] font-semibold text-[#23435f] transition hover:bg-slate-50">
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}

export default function ProgramCatalogSection() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tất cả");

  const filteredPrograms = useMemo(() => {
    if (activeCategory === "Tất cả") return PROGRAMS;
    return PROGRAMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-300">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={[
                  "inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-semibold transition",
                  isActive
                    ? "bg-[#1b78b6] text-white shadow-sm"
                    : "bg-[#efefef] text-slate-700 hover:bg-[#e5e5e5]",
                ].join(" ")}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPrograms.map((item) => (
            <ProgramCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}