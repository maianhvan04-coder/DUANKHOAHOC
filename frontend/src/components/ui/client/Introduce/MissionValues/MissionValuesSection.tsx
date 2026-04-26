"use client";

import { Compass, Mountain, Settings } from "lucide-react";

const missionValues = [
  {
    title: "Sứ mệnh",
    description:
      "Kiến tạo môi trường học tập chất lượng, đồng hành cùng học viên phát triển bền vững.",
    icon: Compass,
  },
  {
    title: "Tầm nhìn",
    description:
      "Trở thành trung tâm giáo dục uy tín, đổi mới tư duy giảng dạy và truyền cảm hứng học tập.",
    icon: Mountain,
  },
  {
    title: "Giá trị cốt lõi",
    description:
      "Chất lượng - Tận tâm - Sáng tạo - Hiệu quả trong từng trải nghiệm học tập.",
    icon: Settings,
  },
];

export default function MissionValuesSection() {
  return (
    <section className="w-full bg-[#d9ecfb] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 md:text-[44px]">
          Mission & Values
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {missionValues.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[18px] bg-white px-6 py-7 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0b4b84] text-[#0b4b84]">
                  <Icon className="h-8 w-8" />
                </div>

                <p className="mt-5 text-[20px] font-bold leading-snug text-slate-900">
                  {item.title}
                </p>

                <p className="mt-3 text-[15px] leading-7 text-slate-700">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}