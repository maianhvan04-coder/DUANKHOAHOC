import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Code2,
  Globe2,
  Handshake,
  Headphones,
  Laptop,
  Lightbulb,
  ListChecks,
  Monitor,
  UserRoundCheck,
} from "lucide-react";
import ExamSystemsSection from "@/components/ui/client/Home/ExamSystem/ExamSystemsSection";
import HomeFeaturedCoursesSection from "@/components/ui/client/Home/FeaturedCourses/HomeFeaturedCoursesSection";

export const metadata: Metadata = {
  title: "Everest - Học tập hiệu quả",
  description:
    "Khám phá các khóa học chất lượng cao, phát triển kỹ năng và đạt mục tiêu học tập cùng Everest.",
};

const programCards = [
  {
    title: "Tiếng Anh",
    count: "50+ khóa học",
    icon: BookOpen,
  },
  {
    title: "IELTS",
    count: "30+ khóa học",
    icon: Globe2,
  },
  {
    title: "TOEIC",
    count: "20+ khóa học",
    icon: Headphones,
  },
  {
    title: "Tin học",
    count: "40+ khóa học",
    icon: Laptop,
  },
  {
    title: "Kỹ năng mềm",
    count: "25+ khóa học",
    icon: Handshake,
  },
  {
    title: "Lập trình",
    count: "35+ khóa học",
    icon: Code2,
  },
];

const processSteps = [
  {
    title: "Đăng kí Tư vấn",
    description: "Đăng ký để tư vấn chương trình học vừa với năng lực.",
    icon: UserRoundCheck,
  },
  {
    title: "Tham gia lớp học",
    description: "Tham gia video, lớp học tham gia lớp học.",
    icon: Monitor,
  },
  {
    title: "Thực hành & Làm bài",
    description: "Thực hành và làm bài, hoàn về lớp học.",
    icon: ListChecks,
  },
  {
    title: "Nhận chứng chỉ",
    description: "Nhận chứng chỉ điểm chứng nhận từ Everest.",
    icon: Lightbulb,
  },
];

const feedbackItems = [
  {
    name: "Nguyễn Thị Lan",
    avatar: "/home/students/student-1.png",
    text: "Chất lượng đào tạo lớn hơn. Tầm lương của giáo viên chuyên nghiệp giúp mình tiến bộ rõ sau từng buổi học.",
  },
  {
    name: "Nana Miha",
    avatar: "/home/students/student-2.png",
    text: "Giáo trình chuyên nghiệp, bài học bám sát mục tiêu và có nhiều bài luyện tập để theo dõi tiến độ.",
  },
  {
    name: "Nait An Kim",
    avatar: "/home/students/student-3.png",
    text: "Cộng đồng học viên thân thiện, thầy cô phản hồi nhanh và giúp mình tự tin hơn khi học online.",
  },
];

function SearchSelect({ label }: { label: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select className="h-11 w-full appearance-none rounded-[10px] border border-slate-200 bg-white px-4 pr-10 text-[14px] font-medium text-slate-700 outline-none transition focus:border-[#0D56A6] focus:ring-4 focus:ring-[#0D56A6]/10">
        <option>{label}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

function HeroMetric({
  className,
  title,
  value,
}: {
  className: string;
  title: string;
  value: string;
}) {
  return (
    <div
      className={[
        "absolute hidden rounded-[8px] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.14)] md:block",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF5FF] text-[#0D56A6]">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-500">{title}</p>
          <p className="text-[12px] font-black text-[#0B2C5F]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: string;
  icon: typeof BookOpen;
}) {
  return (
    <article className="relative overflow-hidden rounded-[12px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[#EAF5FF] text-[#0D56A6]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-[21px] font-black leading-6 text-[#0B2C5F]">
            {title}
          </h3>
          <p className="mt-1 text-[15px] font-semibold text-slate-700">
            {count}
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1.5 w-1/2 rounded-r-full bg-[#A9DAF3]" />
    </article>
  );
}

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <section className="bg-[#DFF1FC]">
        <div className="relative mx-auto grid min-h-[410px] max-w-[1180px] items-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="relative z-10">
            <h1 className="max-w-[500px] text-[42px] font-black leading-[1.05] text-[#0B2C5F] md:text-[56px]">
              Học tập hiệu quả cùng Everest
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] font-semibold leading-7 text-[#1F3554]">
              Khám phá các khóa học chất lượng cao, nâng cao kỹ năng và đạt
              được mục tiêu học tập của bạn với đội ngũ giảng viên hàng đầu.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/khoa-hoc"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#0D56A6] px-5 text-[14px] font-bold text-white transition hover:bg-[#0B4A8E]"
              >
                Đăng ký ngay
              </Link>
              <Link
                href="/gioi-thieu"
                className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[#0D56A6] bg-white/40 px-5 text-[14px] font-bold text-[#0D56A6] transition hover:bg-white"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>

          <div className="relative min-h-[310px]">
            <div className="absolute bottom-0 right-0 h-[310px] w-full max-w-[620px]">
              <Image
                src="/teacher/teachers-group.png"
                alt="Học viên Everest"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 620px"
                className="object-contain object-bottom"
              />
            </div>
            <HeroMetric
              className="left-5 top-10"
              title="Lịch học:"
              value="19:00 AM - Tiếng Anh"
            />
            <HeroMetric
              className="right-4 top-14"
              title="Tiến độ:"
              value="85% hoàn thành"
            />
            <HeroMetric
              className="bottom-10 left-8"
              title="Tiến độ:"
              value="89% hoàn thành"
            />
            <HeroMetric
              className="bottom-12 right-10"
              title="Chứng chỉ:"
              value="IELTS 7.5"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-12 px-4 md:px-6">
        <div className="mx-auto max-w-[880px] rounded-[22px] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
          <h2 className="text-center text-[24px] font-black text-[#0B2C5F]">
            Tìm kiếm nhanh
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_120px]">
            <SearchSelect label="Chương trình" />
            <SearchSelect label="Trình độ" />
            <SearchSelect label="Hình thức" />
            <SearchSelect label="Thời gian" />
            <button
              type="button"
              className="h-11 rounded-[10px] bg-[#0D56A6] text-[14px] font-bold text-white transition hover:bg-[#0B4A8E]"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[30px] font-black text-[#0B2C5F]">
            Chương trình học đa dạng
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {programCards.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[30px] font-black text-[#0B2C5F]">
            Quy trình học tập 4 bước
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-4 md:gap-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="relative text-center">
                  {index < processSteps.length - 1 ? (
                    <div className="absolute left-1/2 top-7 hidden h-[2px] w-full bg-[#8ABFD9] md:block" />
                  ) : null}
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5F5FD] text-[#0D56A6] ring-4 ring-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-2 text-[13px] font-black text-[#0D56A6]">
                    {index + 1}
                  </div>
                  <h3 className="mt-2 text-[14px] font-black text-[#17233A]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium leading-4 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <HomeFeaturedCoursesSection />

      <section className="px-4 pb-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-5">
            <h2 className="text-center text-[30px] font-black text-[#0B2C5F]">
              Feedback học viên
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {feedbackItems.map((item) => (
              <article
                key={item.name}
                className="rounded-[12px] bg-[#EAF5FF] p-5 shadow-[0_8px_22px_rgba(15,23,42,0.06)]"
              >
                <p className="line-clamp-5 text-[13px] font-medium italic leading-6 text-[#17233A]">
                  {item.text}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-cover object-top"
                    />
                  </div>
                  <p className="text-[13px] font-black text-[#17233A]">
                    {item.name}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-1.5">
            <span className="h-2 w-6 rounded-full bg-[#0D56A6]" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </section>

      <ExamSystemsSection />
    </main>
  );
}
