"use client";

import Image from "next/image";

const activities = [
  {
    id: 1,
    image: "/Introduce/FeaturedActivitie/activity-1.jpg",
    alt: "Hoạt động nổi bật 1",
  },
  {
    id: 2,
    image: "/Introduce/FeaturedActivitie/activity-2.jpg",
    alt: "Hoạt động nổi bật 2",
  },
  {
    id: 3,
    image: "/Introduce/FeaturedActivitie/activity-3.jpg",
    alt: "Hoạt động nổi bật 3",
  },
  {
    id: 4,
    image: "/Introduce/FeaturedActivitie/activity-4.jpg",
    alt: "Hoạt động nổi bật 4",
  },
  {
    id: 5,
    image: "/Introduce/FeaturedActivitie/activity-5.jpg",
    alt: "Hoạt động nổi bật 5",
  },
  {
    id: 6,
    image: "/Introduce/FeaturedActivitie/activity-6.jpg",
    alt: "Hoạt động nổi bật 6",
  },
];

export default function FeaturedActivitiesSection() {
  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[30px] font-extrabold leading-tight text-slate-900 md:text-[40px]">
          Hoạt động nổi bật
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {activities.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
            >
              <div className="relative aspect-[1.18/1] w-full">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}