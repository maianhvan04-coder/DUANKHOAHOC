"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Monitor,
  RefreshCw,
  School,
  UsersRound,
} from "lucide-react";
import { classroomApi, type ClassroomItem } from "@/app/api/classroom.api";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  formatDate,
  getClassStatusClass,
  getClassStatusLabel,
  getCourseTitle,
  getErrorMessage,
  getModeLabel,
} from "@/lib/helpers/teacher/classroom";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TeacherHomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setErrorText("");

      const result = await classroomApi.listMinePaged({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setItems(result.items);
    } catch (error) {
      setItems([]);
      setErrorText(getErrorMessage(error, "Không tải được bảng tin giáo viên"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;
    const online = items.filter((item) => item.mode === "ONLINE").length;
    const offline = items.filter((item) => item.mode === "OFFLINE").length;

    return [
      {
        label: "Tổng lớp",
        value: items.length,
        icon: School,
        className: "bg-blue-50 text-blue-700",
      },
      {
        label: "Đang mở",
        value: active,
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Online",
        value: online,
        icon: Monitor,
        className: "bg-violet-50 text-violet-700",
      },
      {
        label: "Offline",
        value: offline,
        icon: UsersRound,
        className: "bg-amber-50 text-amber-700",
      },
    ];
  }, [items]);

  const upcoming = useMemo(
    () => items.filter((item) => item.isActive).slice(0, 6),
    [items]
  );

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0D56A6] dark:text-sky-200">
              Everest Teacher
            </p>
            <h2 className="mt-2 truncate text-2xl font-bold text-slate-950 dark:text-white">
              Xin chào, {user?.name || "Giáo viên"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0D56A6] px-4 text-sm font-bold text-white transition hover:bg-[#0B4B92] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Làm mới
          </button>
        </div>
      </section>

      {errorText ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {errorText}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    item.className
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-bold text-slate-950 dark:text-white">
                  {item.value}
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <CalendarDays className="h-5 w-5 text-[#0D56A6] dark:text-sky-200" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">
            Lịch dạy gần nhất
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
            Chưa có lớp học nào được phân công.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {upcoming.map((item) => (
              <article
                key={item._id}
                className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px_150px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-950 dark:text-white">
                    {item.className || "Lớp học"}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                    {getCourseTitle(item)}
                  </p>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-semibold">
                    {item.scheduleText || "Chưa cập nhật lịch"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.room || getModeLabel(item.mode)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                      getClassStatusClass(item)
                    )}
                  >
                    {getClassStatusLabel(item)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatDate(item.startedAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
