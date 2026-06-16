"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { classroomApi, type ClassroomItem } from "@/app/api/classroom.api";
import {
  formatDate,
  getClassStatusClass,
  getClassStatusLabel,
  getCourseTitle,
  getErrorMessage,
  getModeLabel,
} from "@/lib/helpers/teacher/classroom";

type ModeFilter = "" | "ONLINE" | "OFFLINE";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TeacherSchedulePage() {
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("");

  async function loadData() {
    try {
      setLoading(true);
      setErrorText("");

      const result = await classroomApi.listMinePaged({
        page: 1,
        limit: 100,
        status: "active",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setItems(result.items);
    } catch (error) {
      setItems([]);
      setErrorText(getErrorMessage(error, "Không tải được lịch dạy"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return items.filter((item) => {
      if (modeFilter && item.mode !== modeFilter) return false;
      if (!keyword) return true;

      return [
        item.className,
        getCourseTitle(item),
        item.scheduleText,
        item.room,
        getModeLabel(item.mode),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, modeFilter, searchText]);

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm lớp, khóa học, phòng học..."
                className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
              className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Tất cả hình thức</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0D8DCE] px-5 text-sm font-bold text-white transition hover:bg-[#087FBB] disabled:cursor-not-allowed disabled:opacity-60"
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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <CalendarDays className="h-5 w-5 text-[#0D56A6] dark:text-sky-200" />
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            Danh sách lịch dạy
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-sm font-bold text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-white">
                <th className="px-5 py-4">Lớp học</th>
                <th className="px-5 py-4">Khóa học</th>
                <th className="px-5 py-4">Lịch dạy</th>
                <th className="px-5 py-4">Phòng</th>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4 text-right">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải lịch dạy...
                    </span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm font-semibold text-slate-500"
                  >
                    Chưa có lịch dạy phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className="text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-950 dark:text-white">
                        {item.className || "Lớp học"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {getModeLabel(item.mode)}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {getCourseTitle(item)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {item.scheduleText || "Chưa cập nhật"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {item.room || getModeLabel(item.mode)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>{formatDate(item.startedAt)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Kết thúc: {formatDate(item.endedAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                          getClassStatusClass(item)
                        )}
                      >
                        {getClassStatusLabel(item)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
