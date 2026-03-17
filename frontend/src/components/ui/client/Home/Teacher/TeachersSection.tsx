"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TeacherCard, { type TeacherItem } from "./TeacherCard";

const TEACHERS: TeacherItem[] = [
  {
    name: "Đỗ Thị Thảo Nguyên",
    role: "Giáo viên TOEIC tại IIG Việt Nam",
    image: "/home/teachers/teacher-1.png",
    imageAlt: "Đỗ Thị Thảo Nguyên",
    achievement: "955 TOEIC",
    certificateTitle: "1 chứng chỉ",
    certificateDetail:
      "Thạc sĩ PP Giảng dạy Tiếng Anh (MTESOL & FLT) ĐH Canberra (Úc)",
    educationTitle: "Trình độ học vấn",
    educationDetail:
      "Cử nhân Sư phạm Tiếng Anh Đại học Ngoại ngữ - ĐHQGHN",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "8 năm kinh nghiệm giảng dạy tiếng Anh cho học sinh, sinh viên, người đi làm",
  },
  {
    name: "Nguyễn Thị Lan Anh",
    role: "Giáo viên TOEIC tại IIG Việt Nam",
    image: "/home/teachers/teacher-2.png",
    imageAlt: "Nguyễn Thị Lan Anh",
    achievement: "370 TOEIC S&W",
    certificateTitle: "1 chứng chỉ",
    certificateDetail:
      "Thạc sĩ PP Giảng dạy Tiếng Anh (MTESOL & FLT) ĐH Canberra (Úc)",
    educationTitle: "Trình độ học vấn",
    educationDetail: "Cử nhân Ngôn ngữ Anh Đại học Ngoại ngữ, ĐHQGHN",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "Giảng viên Bộ môn Dịch – ĐH Ngoại ngữ, ĐHQGHN Cựu phóng viên, biên tập viên tiếng Anh – VTV4",
  },
  {
    name: "Nguyễn Sơn Tùng",
    role: "Giáo viên TOEIC tại IIG Việt Nam",
    image: "/home/teachers/teacher-3.png",
    imageAlt: "Nguyễn Sơn Tùng",
    achievement: "980 TOEIC L&R - 400 TOEC S&W - 8.0 IELTS",
    certificateTitle: "1 chứng chỉ",
    certificateDetail:
      "Chứng chỉ giảng dạy TESOL Teaching English To Speakers of Other Languages",
    educationTitle: "Trình độ học vấn",
    educationDetail:
      "Cử nhân ngành Quan hệ Quốc tế Đại học Ohio Wesleyan (US)",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "Giảng dạy tiếng Anh cho nhiều đối tượng tại các tổ chức lớn tại Hà Nội",
  },
];

export default function TeachersSection() {
  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="relative">
          <div className="text-center">
            <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
              <span>Đội ngũ giáo viên</span>
              <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
                ✦
              </span>
            </h2>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 text-[16px] font-bold text-[#0D56A6] transition hover:translate-x-0.5 md:absolute md:right-0 md:top-4 md:mt-0"
          >
            Xem tất cả
            <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 xl:grid-cols-3">
          {TEACHERS.map((teacher) => (
            <TeacherCard key={teacher.name} item={teacher} />
          ))}
        </div>
      </div>
    </section>
  );
}