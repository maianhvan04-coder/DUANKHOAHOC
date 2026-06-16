"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Award, Medal } from "lucide-react";
import {
  studentStudyApi,
  type PublicHonorStudyItem,
} from "@/app/api/student-study.api";

const FALLBACK_STUDENT_IMAGES = [
  "/home/students/student-1.png",
  "/home/students/student-2.png",
  "/home/students/student-3.png",
  "/home/students/student-4.png",
  "/home/students/student-5.png",
  "/home/students/student-6.png",
];

const testimonialFallbacks = [
  {
    name: "Nguyễn Vân A",
    course: "Tiếng Anh Giao Tiếp",
    quote:
      "Thông qua học hỏi đội ngũ giáo viên, tôi cảm nhận rõ mình được dẫn dắt theo một lộ trình rất sát năng lực.",
    image: "/home/students/student-1.png",
  },
  {
    name: "Trần Thị B",
    course: "Công nghệ Thông tin",
    quote:
      "Công ty tử tế, đồng hành muốn tri thức viên tập hẹn vững nhanh qua chương trình học và văn học.",
    image: "/home/students/student-2.png",
  },
  {
    name: "Nguyễn Thanh",
    course: "Lập Trình",
    quote:
      "Thông học nơi tư dinh doanh, nội dung viên cần tuần học như trực tiếp với giảng trình định hơn khác học còn nết nhất.",
    image: "/home/students/student-3.png",
  },
  {
    name: "Lê Hoàng C",
    course: "Công nghệ Thông tin",
    quote:
      "Tri trình tình thăm không trong giám, oi tim lianu hưởng thuận tương tốt trong cuộc và suất với Dự án Xuất sắc.",
    image: "/home/students/student-4.png",
  },
];

const activities = [
  {
    title: "Workshop của discussion",
    image: "/Introduce/FeaturedActivitie/activity-1.jpg",
  },
  {
    title: "Transtatio-talk học ngôn lập",
    image: "/Introduce/FeaturedActivitie/activity-2.jpg",
  },
  {
    title: "Team building exam oat tết, dinh học",
    image: "/Introduce/FeaturedActivitie/activity-5.jpg",
  },
  {
    title: "Giao thao văn hóa học viên",
    image: "/Introduce/FeaturedActivitie/activity-6.jpg",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return e?.response?.data?.message || e?.message || fallback;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function isAllowedImage(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getStudentImage(item: PublicHonorStudyItem | undefined, index: number) {
  if (isAllowedImage(item?.avatar)) return item?.avatar || "";
  return FALLBACK_STUDENT_IMAGES[index % FALLBACK_STUDENT_IMAGES.length];
}

function getHonorScore(item: PublicHonorStudyItem) {
  const title = item.honorTitle || "Học viên xuất sắc";
  if (title.toLowerCase().includes("ielts")) return title;
  if (title.toLowerCase().includes("topik")) return title;
  if (item.finalAverage > 0) return `Điểm ${item.finalAverage.toFixed(1)}`;
  if (item.score > 0) return `Điểm ${item.score.toFixed(1)}`;
  return title;
}

function HonorAvatar({
  item,
  index,
}: {
  item: PublicHonorStudyItem;
  index: number;
}) {
  const image = getStudentImage(item, index);

  return (
    <div className="relative mx-auto flex h-[118px] w-[118px] items-center justify-center rounded-full bg-[#EAD082] p-2 shadow-[0_0_16px_rgba(255,223,98,0.8)]">
      <div className="relative h-full w-full overflow-hidden rounded-full border-[5px] border-white bg-[#f4f7fb]">
        {image ? (
          <Image
            src={image}
            alt={item.name}
            fill
            sizes="118px"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[24px] font-black text-[#0B2C5F]">
            {getInitials(item.name)}
          </div>
        )}
      </div>
      <span className="absolute right-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#C99A19] shadow">
        <Medal className="h-4 w-4" />
      </span>
    </div>
  );
}

function HonorCard({
  item,
  index,
}: {
  item: PublicHonorStudyItem;
  index: number;
}) {
  return (
    <article className="rounded-[18px] border border-[#FFE98A] bg-[#FFF8CD] p-4 text-center shadow-[0_0_18px_rgba(255,219,75,0.82)]">
      <HonorAvatar item={item} index={index} />
      <h3 className="mt-4 text-[18px] font-black leading-tight text-[#223047]">
        {item.name}
      </h3>
      <p className="mt-1 line-clamp-1 text-[14px] font-bold text-[#263B59]">
        {item.courseTitle || item.className || "Học viên Everest"}
      </p>
      <p className="mt-3 text-[16px] font-black text-[#1F2D45]">
        {getHonorScore(item)}
      </p>
    </article>
  );
}

function EmptyHonorCard({ index }: { index: number }) {
  return (
    <article className="rounded-[18px] border border-[#FFE98A] bg-[#FFF8CD] p-4 text-center shadow-[0_0_18px_rgba(255,219,75,0.82)]">
      <div className="relative mx-auto flex h-[118px] w-[118px] items-center justify-center rounded-full bg-[#EAD082] p-2 shadow-[0_0_16px_rgba(255,223,98,0.8)]">
        <div className="flex h-full w-full items-center justify-center rounded-full border-[5px] border-white bg-white text-[24px] font-black text-[#0B2C5F]">
          {index + 1}
        </div>
      </div>
      <h3 className="mt-4 text-[18px] font-black leading-tight text-[#223047]">
        Đang cập nhật
      </h3>
      <p className="mt-1 text-[14px] font-bold text-[#263B59]">
        Học viên Everest
      </p>
      <p className="mt-3 text-[16px] font-black text-[#1F2D45]">
        Thành tích mới
      </p>
    </article>
  );
}

function TestimonialCard({
  item,
  index,
}: {
  item: {
    name: string;
    course: string;
    quote: string;
    image: string;
  };
  index: number;
}) {
  return (
    <article className="flex gap-3 rounded-[10px] border border-slate-200 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
        <Image
          src={item.image || FALLBACK_STUDENT_IMAGES[index % FALLBACK_STUDENT_IMAGES.length]}
          alt={item.name}
          fill
          sizes="48px"
          className="object-cover object-top"
        />
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] font-black leading-5 text-[#17233A]">
          {item.name}
        </h3>
        <p className="text-[12px] font-semibold text-slate-500">
          {item.course}
        </p>
        <p className="mt-2 line-clamp-3 text-[12px] font-medium italic leading-5 text-[#202633]">
          “{item.quote}”
        </p>
      </div>
    </article>
  );
}

export default function PublicStudentsPage() {
  const [items, setItems] = useState<PublicHonorStudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");
        const data = await studentStudyApi.getPublicHonors();

        if (mounted) setItems(data);
      } catch (error) {
        if (!mounted) return;
        setErrorText(
          getErrorMessage(error, "Không tải được danh sách học viên vinh danh")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (b.finalAverage !== a.finalAverage) return b.finalAverage - a.finalAverage;
      return b.score - a.score;
    });
  }, [items]);

  const honorItems = sortedItems.slice(0, 3);

  const testimonialItems = useMemo(() => {
    const fromHonors = sortedItems.slice(0, 4).map((item, index) => ({
      name: item.name,
      course: item.courseTitle || item.className || "Học viên Everest",
      quote:
        item.honorTitle ||
        `Hoàn thành chương trình với điểm tổng kết ${item.finalAverage.toFixed(1)} và tinh thần học tập nổi bật.`,
      image: getStudentImage(item, index),
    }));

    if (fromHonors.length >= 4) return fromHonors;
    return [...fromHonors, ...testimonialFallbacks].slice(0, 4);
  }, [sortedItems]);

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#0C4E89]">
        <div className="relative mx-auto flex min-h-[176px] max-w-[1180px] items-center px-4 py-8 md:px-6 lg:px-0">
          <div className="relative z-10 max-w-[650px]">
            <h1 className="text-[32px] font-black leading-tight text-white md:text-[42px]">
              Cộng đồng học viên Everest
            </h1>
            <p className="mt-3 max-w-[560px] text-[15px] font-semibold leading-6 text-white/90 md:text-[17px]">
              Khám phá các khóa học chất lượng, phát triển kỹ năng và nắm
              trọn được mục tiêu học tập của bạn với đội ngũ giáo viên giàu
              kinh nghiệm tại Everest.
            </p>
          </div>

          <div className="absolute bottom-0 right-4 hidden h-[170px] w-[330px] md:block lg:right-0">
            <Image
              src="/home/community/community-toeic.png"
              alt="Cộng đồng học viên Everest"
              fill
              sizes="330px"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-[1180px] rounded-[18px] bg-[#062B56] px-5 py-7 shadow-[0_12px_32px_rgba(6,43,86,0.22)] md:px-10 md:py-8">
          <div className="mb-6 flex items-center justify-center gap-3 text-[#F7D47C]">
            <Award className="h-8 w-8" />
            <h2 className="text-center text-[28px] font-black leading-tight md:text-[34px]">
              Bảng Vàng Vinh Danh
            </h2>
            <Award className="h-8 w-8" />
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[276px] animate-pulse rounded-[18px] bg-white/20"
                />
              ))}
            </div>
          ) : errorText ? (
            <div className="rounded-[16px] bg-white px-5 py-8 text-center text-[15px] font-semibold text-rose-700">
              {errorText}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {honorItems.length
                ? honorItems.map((item, index) => (
                    <HonorCard
                      key={`${item._id}-${item.studentId || index}`}
                      item={item}
                      index={index}
                    />
                  ))
                : Array.from({ length: 3 }).map((_, index) => (
                    <EmptyHonorCard key={index} index={index} />
                  ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-5 text-center text-[24px] font-black text-[#17233A]">
            Gương mặt tiêu biểu
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {testimonialItems.map((item, index) => (
              <TestimonialCard key={`${item.name}-${index}`} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-6 md:pb-16">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-5 text-center text-[24px] font-black text-[#17233A]">
            Hoạt động ngoại khóa
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activities.map((item) => (
              <article key={item.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                    className="object-cover transition duration-300 hover:scale-[1.03]"
                  />
                </div>
                <h3 className="mt-2 text-[13px] font-black leading-5 text-[#17233A]">
                  {item.title}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
