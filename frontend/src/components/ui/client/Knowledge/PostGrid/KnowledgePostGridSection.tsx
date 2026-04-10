"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Category =
  | "Tất cả"
  | "Phương pháp học"
  | "Kỹ năng học tập"
  | "Tin học"
  | "Ngoại ngữ"
  | "Định hướng học tập"
  | "Phụ huynh đồng hành";

type PostItem = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: Exclude<Category, "Tất cả">;
  image: string;
  badgeColor: string;
};

const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 6;

const categories: Category[] = [
  "Tất cả",
  "Phương pháp học",
  "Kỹ năng học tập",
  "Tin học",
  "Ngoại ngữ",
  "Định hướng học tập",
  "Phụ huynh đồng hành",
];

const posts: PostItem[] = [
  {
    id: 1,
    title: "Bí kíp tự học tiếng Anh giao tiếp hiệu quả tại nhà",
    excerpt:
      "Các phương pháp và tài liệu miễn phí giúp bạn nâng cao kỹ năng nghe nói.",
    date: "10 Tháng 5, 2024",
    category: "Ngoại ngữ",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#22c7c8]",
  },
  {
    id: 2,
    title: "Cách tạo động lực tự học cho con trẻ",
    excerpt:
      "Chia sẻ từ các chuyên gia tâm lý về cách khích lệ và hỗ trợ con trong học tập.",
    date: "8 Tháng 5, 2024",
    category: "Phụ huynh đồng hành",
    image: "/Knowledge/PostGrid/post-grid-2.jpg",
    badgeColor: "bg-[#1f4f8c]",
  },
  {
    id: 3,
    title: "Chiến lược ôn thi đại học hiệu quả",
    excerpt: "Tổng hợp các kinh nghiệm ôn tập và làm bài thi đạt điểm cao.",
    date: "5 Tháng 5, 2024",
    category: "Phương pháp học",
    image: "/Knowledge/PostGrid/post-grid-3.jpg",
    badgeColor: "bg-[#20c9c9]",
  },
  {
    id: 4,
    title: "Rèn kỹ năng ghi chú thông minh khi học",
    excerpt:
      "Phương pháp ghi chú giúp ghi nhớ nhanh hơn và hệ thống kiến thức tốt hơn.",
    date: "3 Tháng 5, 2024",
    category: "Kỹ năng học tập",
    image: "/Knowledge/PostGrid/post-grid-4.jpg",
    badgeColor: "bg-[#6b7280]",
  },
  {
    id: 5,
    title: "Ứng dụng AI hỗ trợ học tập hiệu quả",
    excerpt:
      "Khám phá những công cụ AI hữu ích cho việc học tập và nghiên cứu hiện nay.",
    date: "2 Tháng 5, 2024",
    category: "Tin học",
    image: "/Knowledge/PostGrid/post-grid-5.jpg",
    badgeColor: "bg-[#1f4f8c]",
  },
  {
    id: 6,
    title: "Cách xây dựng thói quen đọc sách mỗi ngày",
    excerpt:
      "Một số mẹo nhỏ giúp bạn duy trì việc đọc sách đều đặn và hiệu quả hơn.",
    date: "1 Tháng 5, 2024",
    category: "Phương pháp học",
    image: "/Knowledge/PostGrid/post-grid-6.jpg",
    badgeColor: "bg-[#20c9c9]",
  },
  {
    id: 7,
    title: "Mẹo ghi nhớ từ vựng tiếng Anh lâu quên",
    excerpt:
      "Áp dụng sơ đồ tư duy và phương pháp lặp lại ngắt quãng để học từ hiệu quả.",
    date: "28 Tháng 4, 2024",
    category: "Ngoại ngữ",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#22c7c8]",
  },
  {
    id: 8,
    title: "Cách chọn ngành học phù hợp với bản thân",
    excerpt:
      "Hiểu rõ năng lực, sở thích và xu hướng nghề nghiệp trước khi quyết định.",
    date: "25 Tháng 4, 2024",
    category: "Định hướng học tập",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#14b8a6]",
  },
  {
    id: 9,
    title: "Top công cụ học online hữu ích cho học sinh",
    excerpt:
      "Danh sách nền tảng và ứng dụng giúp bạn học tập chủ động hơn mỗi ngày.",
    date: "22 Tháng 4, 2024",
    category: "Tin học",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#1f4f8c]",
  },
  {
    id: 10,
    title: "Cách đồng hành cùng con trong giai đoạn thi cử",
    excerpt:
      "Những điều phụ huynh nên làm để giúp con ổn định tâm lý và học tập tốt hơn.",
    date: "20 Tháng 4, 2024",
    category: "Phụ huynh đồng hành",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#1f4f8c]",
  },
  {
    id: 11,
    title: "Quản lý thời gian học tập bằng phương pháp Pomodoro",
    excerpt:
      "Chia nhỏ thời gian học để tăng tập trung và tránh quá tải khi ôn luyện.",
    date: "18 Tháng 4, 2024",
    category: "Kỹ năng học tập",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#6b7280]",
  },
  {
    id: 12,
    title: "Lộ trình ôn thi hiệu quả cho học sinh cuối cấp",
    excerpt:
      "Gợi ý cách phân bổ môn học, thời gian ôn tập và kiểm tra tiến độ hằng tuần.",
    date: "15 Tháng 4, 2024",
    category: "Phương pháp học",
    image: "/Knowledge/PostGrid/post-grid-1.jpg",
    badgeColor: "bg-[#20c9c9]",
  },
];

export default function KnowledgePostGrid() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Tất cả");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "Tất cả") return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_STEP);
  };

  return (
    <section className="bg-white px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="no-scrollbar flex flex-wrap gap-3">
          {categories.map((item) => {
            const isActive = selectedCategory === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => handleSelectCategory(item)}
                className={[
                  "shrink-0 rounded-full px-5 py-3 text-base font-medium transition-all",
                  isActive
                    ? "bg-[#0b4b84] text-white shadow-[0_6px_16px_rgba(11,75,132,0.24)]"
                    : "bg-[#f2f4f7] text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
            >
              <div className="relative aspect-[1.45/1] w-full">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${post.badgeColor}`}
                >
                  {post.category}
                </span>

                <h3 className="mt-3 line-clamp-2 text-[22px] font-bold leading-tight text-slate-900 md:text-[24px]">
                  {post.title}
                </h3>

                <p className="mt-3 line-clamp-2 text-[15px] leading-6 text-slate-600">
                  {post.excerpt}
                </p>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  {post.date}
                </p>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-lg bg-[#0b4b84] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08365f]"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </section>
  );
}