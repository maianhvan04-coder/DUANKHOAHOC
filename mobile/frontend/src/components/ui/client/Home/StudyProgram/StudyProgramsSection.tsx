"use client";

import StudyProgramCard, { type StudyProgramItem } from "./StudyProgramCard";

const PROGRAMS: StudyProgramItem[] = [
  {
    title: "Tiếng Anh tại Everest",
    description:
      "Lộ trình học bài bản giúp học viên phát triển nền tảng, kỹ năng giao tiếp và khả năng sử dụng tiếng Anh tự tin hơn.",
    meta: "Giao tiếp • Phát âm • Ngữ pháp • Luyện thi • Thực hành toàn diện",
    image: "/home/programs/program-1.png",
    imageAlt: "Tiếng Anh tại Everest",
    href: "/",
  },
  {
    title: "Toán học tại Everest",
    description:
      "Chương trình giúp học viên củng cố kiến thức, rèn tư duy logic và nâng cao khả năng giải quyết bài toán theo từng cấp độ.",
    meta: "Toán nền tảng • Toán nâng cao • Tư duy logic • Ôn tập • Luyện bài",
    image: "/home/programs/program-2.png",
    imageAlt: "Toán học tại Everest",
    href: "/",
  },
  {
    title: "Tiếng Trung tại Everest",
    description:
      "Lộ trình học từ cơ bản đến nâng cao, tập trung phát triển từ vựng, giao tiếp và khả năng ứng dụng tiếng Trung trong thực tế.",
    meta: "Nghe nói • Từ vựng • Giao tiếp • Ngữ pháp • Luyện tập thực hành",
    image: "/home/programs/program-3.png",
    imageAlt: "Tiếng Trung tại Everest",
    href: "/",
  },
  {
    title: "Lập trình tại Everest",
    description:
      "Trang bị tư duy công nghệ, kỹ năng lập trình và khả năng xây dựng nền tảng vững chắc cho học tập và định hướng nghề nghiệp.",
    meta: "Tư duy lập trình • Frontend • Backend • Dự án thực hành • Ứng dụng thực tế",
    image: "/home/programs/program-4.png",
    imageAlt: "Lập trình tại Everest",
    href: "/",
  },
];

export default function StudyProgramsSection() {
  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Chương trình học tại Everest</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-[760px] text-[16px] leading-7 text-[#4E5F79] md:text-[17px]">
            Everest xây dựng lộ trình học đa dạng, phù hợp với nhiều độ tuổi,
            mục tiêu học tập và định hướng phát triển khác nhau.
          </p>
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