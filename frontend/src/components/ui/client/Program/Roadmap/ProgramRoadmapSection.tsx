"use client";

import {
  BrainCircuit,
  MapPinned,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

const ROADMAP_STEPS = [
  {
    title: "Đánh giá năng lực",
    description:
      "Đánh giá năng lực và con đường phù hợp để định hướng lộ trình học tập hiệu quả.",
    icon: BrainCircuit,
  },
  {
    title: "Chọn lộ trình",
    description:
      "Chọn lộ trình cá nhân hóa dựa trên mục tiêu, trình độ và định hướng phát triển.",
    icon: MapPinned,
  },
  {
    title: "Học tập đồng hành",
    description:
      "Học tập đồng hành cùng giảng viên, theo sát tiến độ và hỗ trợ trong suốt quá trình.",
    icon: GraduationCap,
  },
  {
    title: "Kiểm tra kết quả",
    description:
      "Đánh giá định kỳ để đo lường tiến bộ, tối ưu phương pháp và nâng cao hiệu quả.",
    icon: BadgeCheck,
  },
];

export default function ProgramRoadmapSection() {
  return (
    <section className="bg-[#F6F6F6] px-4 py-12 md:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#13233f] md:text-[40px]">
            Learning Roadmap
          </h2>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
          {ROADMAP_STEPS.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="relative text-center">
                {index < ROADMAP_STEPS.length - 1 && (
                  <div className="absolute right-[-18px] top-[42px] hidden md:flex lg:right-[-26px]">
                    <ArrowRight className="h-7 w-7 text-[#7a8798]" strokeWidth={1.75} />
                  </div>
                )}

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl">
                  <Icon className="h-16 w-16 text-[#5b87b5]" strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.02em] text-[#1b2430]">
                  {step.title}
                </h3>

                <p className="mx-auto mt-3 max-w-[230px] text-[18px] leading-7 text-[#3f4752]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}