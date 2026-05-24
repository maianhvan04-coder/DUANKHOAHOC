import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Flag,
  GraduationCap,
  Headphones,
  HeartHandshake,
  MessageSquareText,
  NotebookPen,
  Rocket,
  Search,
  ShieldCheck,
  Telescope,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Khám phá Everest - nơi xây dựng môi trường học tập thực tiễn, hiện đại và đồng hành cùng học viên đạt mục tiêu nghề nghiệp.",
};

const overviewBullets = [
  "Chương trình đào tạo thực chiến",
  "Đội ngũ giảng viên chuyên gia",
  "Cơ sở vật chất hiện đại",
  "Hỗ trợ việc làm trọn đời",
];

const trainingMethods: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
}> = [
  {
    title: "Học qua dự án thực tế",
    description:
      "Học viên áp dụng kiến thức vào sản phẩm thật để phát triển tư duy giải quyết vấn đề.",
    icon: BookOpenCheck,
    image: "/Introduce/FeaturedActivitie/activity-1.jpg",
  },
  {
    title: "Mentoring 1-1",
    description:
      "Đội ngũ giảng viên đồng hành sát sao, theo dõi tiến độ và phản hồi thường xuyên.",
    icon: UserRoundCheck,
    image: "/Introduce/FeaturedActivitie/activity-6.jpg",
  },
  {
    title: "Đào tạo kỹ năng mềm",
    description:
      "Rèn luyện giao tiếp, làm việc nhóm và kỹ năng trình bày trong môi trường học tập thực tế.",
    icon: MessageSquareText,
    image: "/Introduce/FeaturedActivitie/activity-5.jpg",
  },
];

const missionItems: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Sứ mệnh",
    description: "Biến tri thức hệ Mình đến tương lai với kiến thức nền kỹ năng thực tiễn.",
    icon: Flag,
  },
  {
    title: "Tầm nhìn",
    description: "Trở thành trung tâm đào tạo hàng đầu khu vực về phát triển năng lực cá nhân.",
    icon: Telescope,
  },
  {
    title: "Giá trị cốt lõi",
    description: "Chuyên nghiệp - Tận tâm - Đổi mới - Hiệu quả.",
    icon: HeartHandshake,
  },
];

const stats = [
  { value: "5000+", label: "Học viên" },
  { value: "100+", label: "Khóa học" },
  { value: "50+", label: "Giảng viên" },
  { value: "98%", label: "Hài lòng" },
];

const learningSteps: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Tìm kiếm khóa học",
    description: "Tìm hiểu khóa học phù hợp với năng lực và mục tiêu.",
    icon: Search,
  },
  {
    title: "Đăng ký & Tư vấn",
    description: "Đăng ký để đội ngũ Everest tư vấn lộ trình phù hợp.",
    icon: NotebookPen,
  },
  {
    title: "Tham gia học tập",
    description: "Tham gia lớp học, xem bài giảng và trao đổi với giảng viên.",
    icon: GraduationCap,
  },
  {
    title: "Thực hành & Dự án",
    description: "Thực hiện bài tập, dự án và nhận phản hồi chi tiết.",
    icon: Rocket,
  },
  {
    title: "Đánh giá & Chứng nhận",
    description: "Đánh giá năng lực và nhận chứng nhận hoàn thành.",
    icon: ClipboardCheck,
  },
];

const teachers = [
  "Nguyễn Văn A",
  "Nguyễn Văn i",
  "Nguyễn Thon",
  "Nguyễn Đèo",
  "Nguyễn Thong",
  "Nguyễn Cn",
  "Nguyễn Xiu",
  "Nguyễn Vâng",
];

const teacherImages = [
  "/home/teachers/teacher-1.png",
  "/home/teachers/teacher-2.png",
  "/home/teachers/teacher-3.png",
  "/teacher/teachers-group.png",
];

const commitments: Array<{
  title: string;
  icon: LucideIcon;
}> = [
  { title: "Minh bạch học phí", icon: FileSearch },
  { title: "Lịch học linh hoạt", icon: CalendarDays },
  { title: "Hỗ trợ 24/7", icon: Headphones },
  { title: "Cam kết đầu ra", icon: ShieldCheck },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[30px] font-black leading-tight text-[#111827] md:text-[36px]">
      {children}
    </h2>
  );
}

export default function Page() {
  return (
    <main className="bg-white">
      <section className="bg-[#D9ECFB] px-4 py-12 text-center md:px-6 md:py-14">
        <div className="mx-auto max-w-[1180px]">
          <h1 className="text-[38px] font-black leading-tight text-[#0B2C5F] md:text-[48px]">
            Về Everest
          </h1>
          <p className="mx-auto mt-4 max-w-[760px] text-[16px] font-semibold leading-7 text-[#1F3554]">
            Sứ mệnh của chúng tôi là trang bị cho học viên kiến thức thực tiễn,
            kỹ năng lành đạo và tư duy đỉnh cao để chinh phục mọi đỉnh cao sự
            nghiệp.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-14">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-[30px] font-black text-[#111827]">Tổng quan</h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-slate-100">
              <Image
                src="/Introduce/AboutOverview/overview-main.jpg"
                alt="Tổng quan Everest"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                priority
              />
            </div>

            <div>
              <h3 className="text-[28px] font-black leading-tight text-[#111827]">
                Chào mừng đến với Everest
              </h3>
              <div className="mt-4 space-y-4 text-[15px] font-medium leading-7 text-[#1F2937]">
                <p>
                  Trang thâm cho tất cả nữ viên viên kiến thức thực tiễn, kỹ
                  năng lãnh đạo và tư duy đỉnh cao để phát triển bền vững.
                </p>
                <p>
                  Giới vật ở đời tuư trải ra niềm vào láot vàng toàn bộ nền
                  tảng học tập online lẫn offline, tạo điều kiện để học viên
                  thực hành, trao đổi và phát triển liên tục.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {overviewBullets.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0D56A6]" />
                    <span className="text-[15px] font-bold text-[#1F2937]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-left text-[34px] font-black leading-tight text-[#111827] md:text-[40px]">
            Phương pháp đào tạo
          </h2>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
            <div className="grid gap-5">
              {trainingMethods.map((item) => {
                const Icon = item.icon;

                return (
                  <details
                    key={item.title}
                    className="group rounded-[14px] border border-[#CFE2F1] bg-[#F5FAFF] px-6 py-5 shadow-[0_8px_22px_rgba(13,86,166,0.06)] md:px-7"
                  >
                    <summary className="flex min-h-[78px] w-full cursor-pointer list-none items-center gap-5 [&::-webkit-details-marker]:hidden">
                      <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#E8F4FF] text-[#0B2C5F]">
                        <Icon className="h-9 w-9" strokeWidth={1.8} />
                      </div>
                      <h3 className="min-w-0 flex-1 text-[18px] font-black text-[#111827] md:text-[20px]">
                        {item.title}
                      </h3>
                      <ChevronDown
                        className="h-5 w-5 shrink-0 text-[#17233A] transition-transform duration-200 group-open:rotate-180"
                        strokeWidth={2.4}
                      />
                    </summary>
                    <p className="ml-[80px] mt-1 pb-1 text-[15px] font-medium leading-7 text-[#334155]">
                      {item.description}
                    </p>
                  </details>
                );
              })}
            </div>

            <div className="grid gap-5">
              {trainingMethods.map((item) => (
                <div
                  key={item.image}
                  className="relative h-[118px] overflow-hidden rounded-[14px] bg-slate-100 shadow-[0_8px_22px_rgba(15,23,42,0.08)] md:h-[126px]"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <SectionTitle>Sứ mệnh - Tầm nhìn - Giá trị cốt lõi</SectionTitle>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {missionItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[12px] border border-slate-200 bg-white p-6 text-center shadow-sm"
                >
                  <Icon className="mx-auto h-12 w-12 text-[#0D56A6]" />
                  <h3 className="mt-4 text-[18px] font-black text-[#111827]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] font-medium leading-6 text-[#475569]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#062B56] px-4 py-10 text-white md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center text-[30px] font-black">Con số nổi bật</h2>

          <div className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label}>
                <p className="text-[42px] font-black leading-none text-[#B9DDF6] md:text-[50px]">
                  {item.value}
                </p>
                <p className="mt-2 text-[17px] font-semibold text-white/90">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <SectionTitle>Quy trình học tập</SectionTitle>

          <div className="mt-9 grid gap-6 md:grid-cols-5">
            {learningSteps.map((item, index) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="relative text-center">
                  {index < learningSteps.length - 1 ? (
                    <div className="absolute left-1/2 top-9 hidden h-[2px] w-full bg-[#B8D3E7] md:block" />
                  ) : null}
                  <div className="relative z-10 mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[#E6F4FF] text-[#0D56A6] ring-4 ring-white">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="relative z-10 mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#0D56A6] text-[14px] font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-3 text-[15px] font-black text-[#111827]">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[180px] text-[12px] font-medium leading-5 text-[#475569]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F2F9FF] px-4 py-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <SectionTitle>Đội ngũ giảng viên</SectionTitle>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((name, index) => (
              <article
                key={`${name}-${index}`}
                className="rounded-[12px] border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-[#E6F4FF]">
                  <Image
                    src={teacherImages[index % teacherImages.length]}
                    alt={name}
                    fill
                    sizes="80px"
                    className="object-cover object-top"
                  />
                </div>
                <h3 className="mt-4 text-[16px] font-black text-[#111827]">
                  {name}
                </h3>
                <p className="mt-1 text-[12px] font-semibold text-[#475569]">
                  Chuyên gia Marketing
                </p>
                <p className="text-[12px] font-medium text-[#64748B]">
                  10+ năm kinh nghiệm
                </p>
                <div className="mt-2 text-[#F6B91A]">★★★★★</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <SectionTitle>Cam kết</SectionTitle>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[12px] border border-slate-200 bg-white p-5 text-center shadow-sm"
                >
                  <Icon className="mx-auto h-10 w-10 text-[#0D56A6]" />
                  <h3 className="mt-3 text-[15px] font-black text-[#111827]">
                    {item.title}
                  </h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0D72D8] px-4 py-12 text-center text-white md:px-6">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-[30px] font-black leading-tight md:text-[38px]">
            Sẵn sàng chinh phục đỉnh cao sự nghiệp?
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#khoa-hoc"
              className="inline-flex h-11 items-center justify-center rounded-[8px] bg-white px-6 text-[14px] font-black text-[#0D56A6] transition hover:bg-[#EEF7FF]"
            >
              Xem khóa học
            </Link>
            <Link
              href="/giang-vien"
              className="inline-flex h-11 items-center justify-center rounded-[8px] border border-white/70 px-6 text-[14px] font-black text-white transition hover:bg-white/10"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
