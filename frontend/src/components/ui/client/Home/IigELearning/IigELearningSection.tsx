"use client";

import { whyChooseFeatures } from "./EverestContent";

export default function WhyChooseSection() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-[30px] font-extrabold leading-tight text-[#111827] md:text-[40px]">
          Vì sao chọn Everest
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {whyChooseFeatures.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full">
                  <Icon className="h-14 w-14 text-[#111827]" strokeWidth={1.8} />
                </div>

                <h3 className="text-[22px] font-extrabold leading-snug text-[#111827]">
                  {item.title}
                </h3>

                <p className="mt-3 max-w-77.5 text-[17px] leading-8 text-[#4B5563]">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}