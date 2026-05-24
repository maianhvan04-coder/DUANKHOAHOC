"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const heroImages = [
  "/hero/hero_banner.png",
  "/hero/hoc-off.webp",
  "/hero/hoc-online.jpg",
  "/hero/image.png",
];

export default function HomeHeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[320px] overflow-hidden rounded-[4px] bg-slate-100 shadow-[0_5px_18px_rgba(15,23,42,0.18)] md:h-[400px] lg:h-[500px]">
      <Link
        href="/#khoa-hoc"
        aria-label="Xem khóa học Everest"
        className="absolute inset-0"
      >
        {heroImages.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt={`Everest banner ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1536px) 60vw, 895px"
            className={[
              "object-cover object-center transition-opacity duration-700",
              index === activeIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
            priority={index === 0}
          />
        ))}
      </Link>

      <div className="absolute inset-x-0 bottom-0 z-10 flex h-10 justify-center gap-4 bg-black/20">
        {heroImages.map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={`Chọn banner ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={[
              "mt-4 h-2.5 w-2.5 rounded-full transition",
              index === activeIndex
                ? "bg-white"
                : "bg-white/50 hover:bg-white/80",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}
