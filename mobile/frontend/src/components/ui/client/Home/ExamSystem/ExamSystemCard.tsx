"use client";

import Image from "next/image";
import Link from "next/link";

export type ExamSystemItem = {
  name: string;
  image: string;
  alt: string;
  href: string;
};

export default function ExamSystemCard({
  item,
}: {
  item: ExamSystemItem;
}) {
  return (
    <Link
      href={item.href}
      className="group flex h-31 items-center justify-center overflow-hidden rounded-[14px] border border-[#E1E3E8] bg-white px-6 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="relative h-18 w-full">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          className="object-contain transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
    </Link>
  );
}