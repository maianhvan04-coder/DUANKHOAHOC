"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type StudyProgramItem = {
  title: string;
  description: string;
  meta: string;
  image: string;
  imageAlt: string;
  href: string;
};

export default function StudyProgramCard({
  item,
}: {
  item: StudyProgramItem;
}) {
  return (
    <article>
      <Link href={item.href} className="group block">
        <div className="relative h-[200px] overflow-hidden rounded-[22px]">
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            className="rounded-[22px] object-cover object-center transition duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-6">
          <h3 className="text-[22px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#032654]">
            {item.title}
          </h3>

          <p className="mt-3 text-[16px] font-medium leading-7 text-[#032654]">
            {item.description}
          </p>

          <p className="mt-4 text-[14px] leading-7 text-[#4E5F79] md:text-[15px]">
            {item.meta}
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-[#0D56A6] transition group-hover:translate-x-1">
            Xem chi tiết
            <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </article>
  );
}