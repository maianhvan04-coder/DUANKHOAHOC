"use client";

import { ArrowRight, ClipboardList, HandCoins, Headphones } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Lộ trình cá nhân",
    description:
      "Thiết kế chương trình học phù hợp với mục tiêu và năng lực của từng học viên.",
    icon: ClipboardList,
  },
  {
    id: 2,
    title: "Học qua dự án",
    description:
      "Tăng cường trải nghiệm thực tế thông qua các bài tập và dự án có tính ứng dụng cao.",
    icon: HandCoins,
  },
  {
    id: 3,
    title: "Hỗ trợ sát sao",
    description:
      "Đội ngũ mentor luôn đồng hành, giải đáp và giúp học viên tiến bộ mỗi ngày.",
    icon: Headphones,
  },
];

export default function TrainingMethodSection() {
  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[28px] font-extrabold leading-tight text-slate-900 md:text-[40px]">
          Phương pháp đào tạo thực chiến
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="absolute right-[-18px] top-8 hidden text-[#0b4b84] md:block">
                    <ArrowRight className="h-7 w-7" />
                  </div>
                )}

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[#0b4b84]">
                  <Icon className="h-11 w-11 stroke-[1.8]" />
                </div>

                <h3 className="mt-4 text-[20px] font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-7 text-slate-600">
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