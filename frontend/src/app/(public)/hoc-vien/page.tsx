"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Medal,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import {
  studentStudyApi,
  type PublicHonorStudyItem,
} from "@/app/api/student-study.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

function HonorMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 transition",
        highlight
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>

      <div
        className={cn(
          "mt-2 text-[30px] font-bold leading-none",
          highlight ? "text-amber-700" : "text-slate-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const rankWrapClass =
    rank === 1
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : rank === 2
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : rank === 3
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <div
      className={cn(
        "inline-flex min-w-[104px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-base font-bold shadow-sm",
        rankWrapClass
      )}
    >
      <Medal className="h-4.5 w-4.5" />
      Top {rank}
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
  const rank = index + 1;
  const isTop1 = rank === 1;
  const isTop2 = rank === 2;
  const isTop3 = rank === 3;

  const cardClass = isTop1
    ? "border-amber-200 shadow-[0_10px_30px_rgba(245,158,11,0.10)]"
    : "border-slate-200 shadow-sm";

  const topBgClass = isTop1
    ? "from-[#fff3c4] via-[#fff9e8] to-[#eef7ff]"
    : isTop2
      ? "from-[#f3f8ff] via-white to-[#eef7ff]"
      : isTop3
        ? "from-[#f7f2ff] via-white to-[#eef7ff]"
        : "from-[#fff7db] via-white to-[#eef7ff]";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[30px] border bg-white transition hover:-translate-y-0.5 hover:shadow-md",
        cardClass
      )}
    >
      <div className={cn("bg-gradient-to-r px-5 py-5 md:px-6", topBgClass)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-white/80 object-cover shadow-sm"
              />
            ) : (
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[18px] font-bold shadow-sm",
                  isTop1
                    ? "bg-white text-amber-700"
                    : "bg-white text-slate-700"
                )}
              >
                {getInitials(item.name)}
              </div>
            )}

            <div className="min-w-0">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                  isTop1
                    ? "bg-amber-100 text-amber-700"
                    : "border border-slate-200 bg-white/80 text-slate-700"
                )}
              >
                <Award className="h-3.5 w-3.5" />
                {item.honorTitle || "Học viên xuất sắc"}
              </div>

              <h2 className="mt-3 text-[24px] font-bold leading-tight text-slate-900">
                {item.name}
              </h2>

              <div className="mt-2 space-y-1 text-[15px] text-slate-500">
                <p className="leading-6">
                  {item.courseTitle || "Khóa học"} · {item.className || "Lớp học"}
                </p>
                <p>GV: {item.teacherName || "Giảng viên"}</p>
                {item.email ? (
                  <p className="truncate text-slate-400">{item.email}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <RankBadge rank={rank} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 px-5 py-4 md:grid-cols-2 md:px-6">
        <HonorMetric
          label="Điểm quy đổi"
          value={item.score.toFixed(1)}
          highlight={isTop1}
        />
        <HonorMetric
          label="Điểm tổng kết"
          value={item.finalAverage.toFixed(1)}
          highlight={isTop1}
        />
      </div>
    </article>
  );
}

export default function PublicHonorsPage() {
  const [items, setItems] = useState<PublicHonorStudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const data = await studentStudyApi.getPublicHonors();

        if (!mounted) return;
        setItems(data);
      } catch (error) {
        if (!mounted) return;
        setErrorText(
          getErrorMessage(error, "Không tải được danh sách học viên xuất sắc")
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

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [
        item.name,
        item.email,
        item.honorTitle,
        item.className,
        item.courseTitle,
        item.teacherName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, keyword]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (b.finalAverage !== a.finalAverage) {
        return b.finalAverage - a.finalAverage;
      }

      return b.score - a.score;
    });
  }, [filteredItems]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#fff5db] via-white to-[#eef7ff] px-6 py-10 md:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                <Sparkles className="h-4 w-4" />
                Vinh danh học viên
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Học viên xuất sắc
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
                Danh sách học viên được admin gắn vinh danh và cho phép hiển thị
                bên user.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">
                  <Users className="h-4 w-4" />
                  {sortedItems.length} học viên được vinh danh
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">
                  <Trophy className="h-4 w-4" />
                  Xếp hạng theo điểm
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">
                  <Star className="h-4 w-4" />
                  Hiển thị tự động từ admin
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 md:px-6">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm học viên, lớp, khóa học, giảng viên..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="px-4 py-6 md:px-6 md:py-8">
            {loading ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
                Đang tải danh sách học viên xuất sắc...
              </div>
            ) : errorText ? (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-16 text-center text-sm text-rose-700">
                {errorText}
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <Award className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  Chưa có học viên được vinh danh
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Khi admin bật “Đánh dấu học viên xuất sắc” và “Hiển thị bên
                  user”, danh sách sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {sortedItems.map((item, index) => (
                  <div
                    key={`${item._id}-${item.studentId || index}`}
                    className={index === 0 ? "xl:col-span-2" : undefined}
                  >
                    <HonorCard item={item} index={index} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}