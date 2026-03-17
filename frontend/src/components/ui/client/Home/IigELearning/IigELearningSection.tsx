"use client";

import Image from "next/image";
import EverestContent from "./EverestContent";

export default function EverestSection() {
  return (
    <section className="bg-[#F3F3F3] py-16 md:py-20">
      <div className="mx-auto max-w-310">
        <div className="grid items-center gap-14 lg:grid-cols-[680px_minmax(0,1fr)]">
          {/* Left: 1 ảnh tổng */}
          <div className="mx-auto w-full max-w-155">
            <div className="relative aspect-[1.37/1] w-full overflow-hidden rounded-[28px]">
              <Image
                src="/home/everest/everest-combo.png"
                alt="Everest learning overview"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Right */}
          <EverestContent />
        </div>
      </div>
    </section>
  );
}