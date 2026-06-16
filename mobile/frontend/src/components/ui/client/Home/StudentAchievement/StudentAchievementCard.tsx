"use client";

import Image from "next/image";

export type StudentAchievementItem = {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  score: string;
  exam: string;
  skill: string;
};

export default function StudentAchievementCard({
  item,
}: {
  item: StudentAchievementItem;
}) {
  return (
    <article>
      <div className="relative h-54 md:h-55">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          className="rounded-2xl object-cover object-center"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#032654] md:text-[16px]">
            {item.name}
          </h3>

          <p className="mt-1 text-[14px] leading-tight text-[#5B667A] md:text-[14px]">
            {item.role}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-start justify-end gap-2">
            <span className="text-[38px] font-extrabold leading-none tracking-[-0.03em] text-[#0D56A6] md:text-[40px]">
              {item.score}
            </span>

            <div className="pt-1 text-left leading-none text-[#9AA6BA]">
              <div className="text-[12px] font-medium uppercase">{item.exam}</div>
              <div className="mt-0.5 text-[12px] font-medium">{item.skill}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}