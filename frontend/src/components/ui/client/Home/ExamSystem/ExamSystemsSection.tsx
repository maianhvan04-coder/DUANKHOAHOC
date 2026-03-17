"use client";

import ExamSystemCard, { type ExamSystemItem } from "./ExamSystemCard";

const EXAM_SYSTEMS: ExamSystemItem[] = [
  {
    name: "IC3",
    image: "/home/exams/ic3.png",
    alt: "IC3 Digital Literacy Certification",
    href: "/",
  },
  {
    name: "MOS",
    image: "/home/exams/mos.png",
    alt: "Microsoft Office Specialist",
    href: "/",
  },
  {
    name: "TOEFL iBT",
    image: "/home/exams/toefl-ibt.png",
    alt: "TOEFL iBT",
    href: "/",
  },
  {
    name: "TOEFL",
    image: "/home/exams/toefl.png",
    alt: "TOEFL",
    href: "/",
  },
  {
    name: "Adobe Certified",
    image: "/home/exams/adobe.png",
    alt: "Adobe Certified",
    href: "/",
  },
];

export default function ExamSystemsSection() {
  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Hệ thống các bài thi</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>

          <p className="mt-8 text-[22px] font-bold leading-[1.35] tracking-[-0.02em] text-[#032654] md:text-[24px]">
            Hơn 30 bài thi từ các tổ chức giáo dục uy tín trên thế giới
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
          {EXAM_SYSTEMS.map((item) => (
            <ExamSystemCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}