"use client";

import Image from "next/image";

export default function AboutOverviewSection() {
  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="order-1">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[1.45/1] w-full">
                <Image
                  src="/Introduce/AboutOverview/overview-main.jpg"
                  alt="Câu chuyện của chúng tôi"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="order-2 max-w-xl">
            <p className="text-[20px] font-semibold text-[#2d5b87]">Overview</p>

            <h2 className="mt-2 text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 md:text-[46px]">
              Câu chuyện của
              <br />
              chúng tôi
            </h2>

            <div className="mt-5 space-y-4 text-[15px] leading-7 text-slate-600 md:text-[16px]">
              <p>
                Được thành lập với sứ mệnh mang lại nền tảng giáo dục chất
                lượng cao, Everest không ngừng nỗ lực để trở thành người bạn
                đồng hành tin cậy của hàng nghìn học viên.
              </p>

              <p>
                Chúng tôi tin rằng mỗi học viên đều có tiềm năng riêng và xứng
                đáng có một lộ trình học tập phù hợp để phát huy tối đa khả năng
                của mình.
              </p>

              <p>
                Everest không chỉ là nơi học tập mà còn là môi trường phát
                triển toàn diện, nơi người học được truyền cảm hứng, rèn luyện
                kỹ năng và sẵn sàng cho những cơ hội lớn hơn trong tương lai.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}