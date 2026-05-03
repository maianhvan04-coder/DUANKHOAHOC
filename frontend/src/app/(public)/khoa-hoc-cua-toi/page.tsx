"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Loader2, Search } from "lucide-react";
import {
  accountApi,
  type MyCourseItem,
  type MyCourseStatus,
} from "@/app/api/account.api";
import { useAuth } from "@/hooks/auth/useAuth";

type CourseFilter = "all" | MyCourseStatus;

const FILTERS: Array<{ key: CourseFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "assigned", label: "Đã xếp lớp" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (isObject(error) && isObject(error.response)) {
    const data = error.response.data;
    if (isObject(data) && isNonEmptyString(data.message)) return data.message;
  }

  return fallback;
}

function getStatusLabel(status: MyCourseStatus) {
  if (status === "assigned") return "Đã xếp lớp";
  if (status === "approved") return "Đã duyệt";
  return "Chờ duyệt";
}

function getStatusClass(status: MyCourseStatus) {
  if (status === "assigned") return "bg-violet-500 text-white";
  if (status === "approved") return "bg-emerald-500 text-white";
  return "bg-sky-500 text-white";
}

function normalizeText(value: string | undefined) {
  return value?.trim() || "--";
}

export default function MyCoursesPage() {
  const { user, hydrated, isLoading } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [activeFilter, setActiveFilter] = useState<CourseFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hydrated || isLoading) return;

    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const data = await accountApi.getMyCourses();
        if (mounted) setItems(data);
      } catch (error: unknown) {
        if (!mounted) return;
        setErrorText(
          getErrorMessage(error, "Không tải được khóa học của tôi")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [hydrated, isLoading, userId]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      if (activeFilter !== "all" && item.status !== activeFilter) return false;
      if (!keyword) return true;

      return [
        item.title,
        item.format,
        item.desiredSchedule,
        item.className,
        item.teacherName,
        item.actualSchedule,
        getStatusLabel(item.status),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [activeFilter, items, query]);

  if (!hydrated || isLoading || loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] py-10">
        <section className="mx-auto max-w-[1240px] px-4 md:px-6">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm font-semibold text-slate-600 shadow-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải khóa học của tôi...
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] py-10">
        <section className="mx-auto max-w-[1240px] px-4 md:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <BookOpenCheck className="mx-auto h-12 w-12 text-slate-400" />
            <h1 className="mt-4 text-2xl font-black text-slate-950">
              Vui lòng đăng nhập
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Bạn cần đăng nhập để xem danh sách khóa học đã đăng ký.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#167F8F] px-5 text-sm font-bold text-white transition hover:bg-[#126B79]"
            >
              Đăng nhập
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-8">
      <section className="mx-auto max-w-[1240px] px-4 md:px-6">
        <h1 className="text-3xl font-black tracking-tight text-[#0B203B] md:text-4xl">
          Khóa học của tôi (My Courses)
        </h1>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-slate-700">
              Sort by:
            </span>
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "h-10 rounded-lg border px-5 text-sm font-bold shadow-sm transition",
                  activeFilter === filter.key
                    ? "border-[#167F8F] bg-[#167F8F] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#167F8F]/50"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm lg:w-[300px]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm bạn"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {errorText ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorText}
          </div>
        ) : null}

        {filteredItems.length === 0 ? (
          <div className="mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <BookOpenCheck className="h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-xl font-black text-slate-950">
              Chưa có khóa học phù hợp
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Các khóa học bạn đăng ký sẽ hiển thị tại đây sau khi hệ thống ghi nhận.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="relative min-h-[210px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <span
                  className={cn(
                    "absolute right-4 top-4 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm",
                    getStatusClass(item.status)
                  )}
                >
                  {getStatusLabel(item.status)}
                </span>

                <h2 className="pr-28 text-xl font-black leading-6 text-[#0B203B]">
                  {item.title}
                </h2>

                <dl className="mt-4 grid grid-cols-[138px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm leading-6">
                  <dt className="font-black text-slate-950">Format:</dt>
                  <dd className="text-slate-800">{normalizeText(item.format)}</dd>

                  <dt className="font-black text-slate-950">
                    Lịch học mong muốn:
                  </dt>
                  <dd className="text-slate-800">
                    {normalizeText(item.desiredSchedule)}
                  </dd>

                  <dt className="font-black text-slate-950">Lớp đã xếp:</dt>
                  <dd className="text-slate-800">{normalizeText(item.className)}</dd>

                  <dt className="font-black text-slate-950">Giảng viên:</dt>
                  <dd className="text-slate-800">
                    {normalizeText(item.teacherName)}
                  </dd>

                  <dt className="font-black text-slate-950">
                    Lịch học thực tế:
                  </dt>
                  <dd className="text-slate-800">
                    {normalizeText(item.actualSchedule)}
                  </dd>
                </dl>

                <div className="mt-5 flex justify-end">
                  <Link
                    href="/student/bang-tin"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#167F8F] px-4 text-sm font-bold text-white transition hover:bg-[#126B79]"
                  >
                    Xem chi tiết học tập
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
