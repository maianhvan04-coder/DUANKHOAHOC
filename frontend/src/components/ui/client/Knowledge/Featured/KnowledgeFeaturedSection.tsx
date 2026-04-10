"use client";

import Image from "next/image";

const sidePosts = [
  {
    id: 1,
    title: "Cách cải thiện khả năng tập trung trong giờ học",
    tag: "Kỹ năng học tập",
    date: "18 Tháng 5, 2024",
    image: "/Knowledge/Featured/knowledge-2.jpg",
  },
  {
    id: 2,
    title: "Ứng dụng công nghệ AI trong giáo dục hiện đại",
    tag: "Tin học",
    date: "15 Tháng 5, 2024",
    image: "/Knowledge/Featured/knowledge-3.jpg",
  },
  {
    id: 3,
    title: "Chọn ngành đại học phù hợp với tính cách và sở thích",
    tag: "Định hướng học tập",
    date: "12 Tháng 5, 2024",
    image: "/Knowledge/Featured/knowledge-4.jpg",
  },
];

export default function KnowledgeFeaturedSection() {
  return (
    <section className="w-full bg-white px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <article className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/8.3] w-full">
              <Image
                src="/Knowledge/Featured/knowledge-1.png"
                alt="Bí quyết quản lý thời gian hiệu quả cho học sinh trung học"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="p-4 md:p-5">
              <span className="inline-flex rounded-full bg-[#0b4b84] px-3 py-1 text-xs font-semibold text-white">
                Phương pháp học
              </span>

              <h3 className="mt-3 text-[24px] font-bold leading-tight text-slate-900 md:text-[30px]">
                Bí quyết quản lý thời gian hiệu quả cho học sinh trung học
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                Khám phá các kỹ thuật lập kế hoạch và ưu tiên giúp cân bằng việc
                học tập và hoạt động ngoại khóa.
              </p>

              <p className="mt-4 text-sm font-medium text-slate-500">
                20 Tháng 5, 2024
              </p>
            </div>
          </article>

          <div className="space-y-4">
            {sidePosts.map((post) => (
              <article
                key={post.id}
                className="flex gap-3 rounded-[16px] border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="relative h-[96px] w-[120px] shrink-0 overflow-hidden rounded-[12px]">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="inline-flex w-fit rounded-full bg-[#1ba6a6] px-3 py-1 text-[11px] font-semibold text-white">
                    {post.tag}
                  </span>

                  <h4 className="mt-2 line-clamp-3 text-[18px] font-bold leading-snug text-slate-900">
                    {post.title}
                  </h4>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {post.date}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}