"use client";

import Image from "next/image";
import { Eye, Lightbulb, HandHeart } from "lucide-react";

const valueCards = [
  {
    title: "Tầm nhìn",
    description:
      "Trở thành tổ chức giáo dục tiên phong trong việc xây dựng môi trường học tập hiện đại, truyền cảm hứng và phát triển toàn diện.",
    icon: Eye,
  },
  {
    title: "Sứ mệnh",
    description:
      "Đồng hành cùng học viên trên hành trình chinh phục tri thức, phát triển kỹ năng và đạt hiệu suất học tập tối ưu.",
    icon: Lightbulb,
  },
  {
    title: "Giá trị cốt lõi",
    description:
      "Lấy chất lượng giảng dạy, sự tận tâm và tinh thần đổi mới làm nền tảng trong mọi hoạt động giáo dục.",
    icon: HandHeart,
  },
];

export default function BrandStorySection() {
  return (
    <section className="bg-white px-4 py-12 md:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr_1fr] lg:items-start">
          <div>
            <p className="text-[20px] font-semibold text-slate-500">
              Brand Story
            </p>

            <h2 className="mt-2 text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 md:text-[40px]">
              Hành trình của chúng tôi
            </h2>

            <div className="mt-6 space-y-5 text-[15px] leading-7 text-slate-600 md:text-[16px]">
              <p>
                Everest E-learning được xây dựng với mong muốn tạo nên một môi
                trường học tập hiện đại, nơi mỗi học viên đều có cơ hội tiếp
                cận kiến thức chất lượng, rèn luyện tư duy chủ động và phát
                triển kỹ năng cần thiết cho tương lai.
              </p>

              <p>
                Từ những ngày đầu, chúng tôi không chỉ tập trung vào việc giảng
                dạy kiến thức mà còn chú trọng xây dựng phương pháp học hiệu
                quả, cá nhân hóa lộ trình và đồng hành cùng học viên trong suốt
                quá trình phát triển.
              </p>

              <p>
                Hành trình ấy được hình thành từ niềm tin rằng giáo dục không
                chỉ dừng ở kết quả học tập, mà còn là khả năng giúp người học
                tự tin hơn, bền bỉ hơn và sẵn sàng thích nghi với những thay đổi
                của thế giới hiện đại.
              </p>
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[1/1.08] w-full">
                <Image
                  src="/Introduce/Hero/brand-story.png"
                  alt="Hành trình thương hiệu Everest"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <p className="mt-3 text-center text-[13px] leading-5 text-slate-500">
              Khoảnh khắc đội ngũ cùng xây dựng định hướng giáo dục và phát triển
              tương lai bền vững cho học viên.
            </p>
          </div>

          <div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
              {valueCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[22px] bg-[#e6f6fb] px-5 py-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b4b84] text-white shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h4 className="mt-5 text-[20px] font-bold leading-tight text-slate-900">
                      {item.title}
                    </h4>

                    <p className="mt-3 text-[15px] leading-7 text-slate-700">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}