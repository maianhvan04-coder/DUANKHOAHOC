"use client";

import StudyProgramCard, { type StudyProgramItem } from "./StudyProgramCard";

const PROGRAMS: StudyProgramItem[] = [
  {
    title: "LUYỆN THI TOEIC",
    description:
      "Chương trình luyện thi TOEIC bài bản, phù hợp cho học sinh, sinh viên và người đi làm",
    meta: "24 bộ đề • 1000+ bài giảng trực tuyến • 80+ đề thi thử",
    image: "/home/programs/program-1.png",
    imageAlt: "Luyện thi TOEIC",
    href: "/",
  },
  {
    title: "KHÓA HỌC KỸ NĂNG",
    description:
      "Nhiều khóa học đa dạng như kỹ năng mềm, tin học, giao tiếp và phát triển tư duy",
    meta: "Lộ trình rõ ràng • Nội dung thực tiễn • Phù hợp nhiều độ tuổi",
    image: "/home/programs/program-2.png",
    imageAlt: "Khóa học kỹ năng",
    href: "/",
  },
  {
    title: "LUYỆN THI TIN HỌC",
    description:
      "Trang bị kỹ năng tin học văn phòng, thực hành thực tế và ứng dụng hiệu quả",
    meta: "50+ đề thi thử • Hướng dẫn thực hành chi tiết",
    image: "/home/programs/program-3.png",
    imageAlt: "Luyện thi tin học",
    href: "/",
  },
  {
    title: "LUYỆN THI TOEFL",
    description:
      "Chương trình luyện thi TOEFL chuẩn hóa với tài liệu và bài tập theo định hướng quốc tế",
    meta: "100+ video giảng dạy tương tác • 2000+ bài tập • Đề thi thử chuẩn ETS",
    image: "/home/programs/program-4.png",
    imageAlt: "Luyện thi TOEFL",
    href: "/",
  },
];

export default function StudyProgramsSection() {
  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Chương trình học</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {PROGRAMS.map((item) => (
            <StudyProgramCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}