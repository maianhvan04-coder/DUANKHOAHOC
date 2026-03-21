"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Award,
  BookOpen,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { teacherApi, type TeacherItem } from "@/app/api/teacher.api";

const INITIAL_VISIBLE = 3;
const LOAD_MORE_STEP = 3;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "T";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function truncate(value?: string, max = 120) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function isAllowedAvatar(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getTeacherIntro(item: TeacherItem) {
  return (
    item.experience ||
    item.bio ||
    "Giảng viên đang trực tiếp giảng dạy và đồng hành cùng học viên tại hệ thống."
  );
}

function getTeacherAchievement(item: TeacherItem) {
  return item.achievement || "Đang cập nhật thành tích của giảng viên.";
}

function TeacherAvatar({ item }: { item: TeacherItem }) {
  const canRenderImage = isAllowedAvatar(item.avatar);

  if (canRenderImage) {
    return (
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-[26px] bg-[#F6EFE8]">
        <Image
          src={item.avatar}
          alt={item.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/10 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex aspect-4/3 w-full items-center justify-center rounded-[26px] bg-[#F6EFE8]">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-semibold text-slate-700 shadow-sm">
        {getInitials(item.name)}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      </div>

      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <div className="mb-1.5 flex justify-center text-slate-700">{icon}</div>
      <p className="text-[16px] font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ContactRow({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0 text-slate-500">{icon}</div>
      <span className="wrap-break-word text-sm text-slate-600">{text}</span>
    </div>
  );
}

function TeacherCard({ item }: { item: TeacherItem }) {
  const products = item.products || [];

  return (
    <article className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg md:p-5">
      <TeacherAvatar item={item} />

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {item.specialty || "Giảng viên"}
          </span>
        </div>

        <h2 className="mt-3 text-[24px] font-bold leading-tight text-slate-900">
          {item.name}
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatItem
          icon={<Star className="h-4 w-4 text-amber-500" />}
          label="Đánh giá"
          value={(item.rating || 0).toFixed(1)}
        />
        <StatItem
          icon={<Users className="h-4 w-4" />}
          label="Học viên"
          value={formatNumber(item.totalStudents || 0)}
        />
        <StatItem
          icon={<BookOpen className="h-4 w-4" />}
          label="Khóa học"
          value={String(item.productCount || 0)}
        />
      </div>

      <div className="mt-4">
        <SectionCard
          icon={<Sparkles className="h-4 w-4" />}
          title="Giới thiệu / Kinh nghiệm"
        >
          <p>{truncate(getTeacherIntro(item), 130)}</p>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SectionCard
          icon={<GraduationCap className="h-4 w-4" />}
          title="Bằng cấp"
        >
          <p>{truncate(item.degree || "Đang cập nhật thông tin bằng cấp.", 90)}</p>
        </SectionCard>

        <SectionCard icon={<Award className="h-4 w-4" />} title="Thành tích">
          <p>{truncate(getTeacherAchievement(item), 90)}</p>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          icon={<Mail className="h-4 w-4" />}
          title="Thông tin liên hệ"
        >
          <div className="space-y-3">
            <ContactRow
              icon={<Mail className="h-4 w-4" />}
              text={item.email || "Chưa cập nhật email"}
            />
            <ContactRow
              icon={<Phone className="h-4 w-4" />}
              text={item.phone || "Chưa cập nhật số điện thoại"}
            />
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          icon={<BookOpen className="h-4 w-4" />}
          title="Khóa học giảng dạy"
        >
          {products.length ? (
            <div className="flex flex-wrap gap-2">
              {products.slice(0, 3).map((product) => (
                <span
                  key={product._id}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {product.title}
                </span>
              ))}

              {products.length > 3 && (
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  +{products.length - 3} khóa học
                </span>
              )}
            </div>
          ) : (
            <p className="italic text-slate-500">
              Đang cập nhật khóa học giảng dạy.
            </p>
          )}
        </SectionCard>
      </div>
    </article>
  );
}

export default function PublicTeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  async function loadData() {
    try {
      setLoading(true);
      const data = await teacherApi.listPublic();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load teachers failed:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const text = [
        item.name,
        item.email,
        item.specialty,
        item.phone,
        item.degree,
        item.experience,
        item.bio,
        item.achievement,
        ...(item.products || []).map((p) => p.title),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [search]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-10 lg:px-8">
      <section className="mx-auto max-w-297">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">

            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Giảng viên đồng hành cùng học viên
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Đội ngũ giảng viên giàu kinh nghiệm, có chuyên môn thực chiến và
              đang trực tiếp tham gia giảng dạy tại hệ thống.
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, chuyên môn, khóa học..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-500">
            Đang tải giảng viên...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-500">
            Không tìm thấy giảng viên phù hợp.
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <TeacherCard key={item._id} item={item} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) => prev + LOAD_MORE_STEP)
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
                >
                  Xem thêm giảng viên
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}