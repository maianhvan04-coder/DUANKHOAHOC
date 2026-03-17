"use client";

import Link from "next/link";

export default function EverestContent() {
  return (
    <div className="max-w-155">
      <h2 className="mt-6 text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#032654] md:text-[36px]">
        Everest E-Learning 🚀
        <br />
        Học tập bứt phá, phát triển toàn diện
      </h2>

      <p className="mt-8 max-w-175 text-[17px] leading-8 text-[#4C5D76] md:text-[14px] md:leading-9">
        Everest là hệ thống đào tạo hướng đến sự phát triển toàn diện về học
        tập, kỹ năng và tư duy. Với phương pháp giảng dạy hiện đại, đội ngũ
        giáo viên đồng hành tận tâm và môi trường học tập linh hoạt, Everest
        giúp học viên xây dựng nền tảng vững chắc để chinh phục mục tiêu học
        tập và phát triển bản thân.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex h-14.5 items-center justify-center rounded-xl bg-[#0D56A6] px-9 text-[18px] font-bold text-white transition hover:bg-[#0A478A]"
      >
        Tìm hiểu thêm
      </Link>
    </div>
  );
}