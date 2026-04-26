"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    id: 1,
    name: "Nguyễn Minh T",
    role: "Học viên IELTS",
    content:
      "Everest đã thay đổi hoàn toàn cách tôi tiếp cận việc học. Phương pháp giảng dạy rất thực tế và lộ trình rõ ràng giúp mình tiến bộ vượt mong đợi.",
    image: "/Introduce/Testimonials/student-1.png",
    avatar: "/Introduce/Testimonials/student-1.png",
  },
  {
    id: 2,
    name: "Trần Khánh Linh",
    role: "Học viên TOEIC",
    content:
      "Mình thích cách thầy cô theo sát từng giai đoạn học tập. Bài giảng dễ hiểu, tài liệu rõ ràng và luôn có người hỗ trợ khi cần.",
    image: "/Introduce/Testimonials/student-2.png",
    avatar: "/Introduce/Testimonials/student-2.png",
  },
  {
    id: 3,
    name: "Lê Hoàng Nam",
    role: "Sinh viên",
    content:
      "Không chỉ học kiến thức, mình còn rèn được tư duy và sự tự tin khi sử dụng tiếng Anh. Đây là môi trường học tập rất đáng để đầu tư.",
    image: "/Introduce/Testimonials/student-3.png",
    avatar: "/Introduce/Testimonials/student-3.png",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const currentItem = testimonials[currentIndex];

  return (
    <section className="w-full bg-[#dcecf8] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[30px] font-extrabold leading-tight text-slate-900 md:text-[40px]">
          Testimonials
        </h2>

        <div className="mt-8 flex items-center justify-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Xem đánh giá trước"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <article className="grid w-full max-w-4xl gap-0 overflow-hidden rounded-[22px] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] md:grid-cols-[260px_1fr]">
            <div className="relative min-h-[220px] md:min-h-[250px]">
              <Image
                src={currentItem.image}
                alt={currentItem.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center p-6 md:p-8">
              <Quote className="h-8 w-8 text-[#0b4b84]" />

              <p className="mt-4 text-[16px] leading-7 text-slate-700 md:text-[17px]">
                “{currentItem.content}”
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={currentItem.avatar}
                    alt={currentItem.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {currentItem.name}
                  </p>
                  <p className="text-sm text-slate-500">{currentItem.role}</p>
                </div>
              </div>
            </div>
          </article>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Xem đánh giá tiếp theo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-slate-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {testimonials.map((item, index) => {
            const isActive = index === currentIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Chuyển tới đánh giá ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={[
                  "h-2.5 rounded-full transition-all",
                  isActive ? "w-6 bg-[#0b1f3a]" : "w-2.5 bg-slate-300",
                ].join(" ")}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}