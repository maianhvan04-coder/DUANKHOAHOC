"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserSquare2,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminPanel from "@/components/layouts/admin/sidebar/AdminPanel";
import AdminStatCard from "@/components/layouts/admin/sidebar/AdminStatCard";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";
import {
  dashboardApi,
  type DashboardCard,
  type DashboardChartPoint,
  type DashboardQuickRow,
  type DashboardStatCard,
} from "@/app/api/dashboard.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    const responseError = maybeError.response?.data?.error;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

const EMPTY_OVERVIEW: DashboardCard[] = [
  { label: "Khóa học hoạt động", value: "0" },
  { label: "Lớp hôm nay", value: "0" },
  { label: "Giảng viên online", value: "0" },
  { label: "Yêu cầu mới", value: "0" },
];

const EMPTY_STATS: DashboardStatCard[] = [
  {
    key: "students",
    label: "Tổng học viên",
    value: "0",
    change: "0%",
    positive: true,
  },
  {
    key: "teachers",
    label: "Giảng viên",
    value: "0",
    change: "0%",
    positive: true,
  },
  {
    key: "courses",
    label: "Khóa học",
    value: "0",
    change: "0%",
    positive: true,
  },
  {
    key: "revenue",
    label: "Doanh thu",
    value: "₫ 0",
    change: "0%",
    positive: true,
  },
];

const EMPTY_ENROLLMENT: DashboardChartPoint[] = [
  { month: "T1", value: 0 },
  { month: "T2", value: 0 },
  { month: "T3", value: 0 },
  { month: "T4", value: 0 },
  { month: "T5", value: 0 },
  { month: "T6", value: 0 },
];

const EMPTY_REVENUE: DashboardChartPoint[] = [
  { month: "T1", value: 0 },
  { month: "T2", value: 0 },
  { month: "T3", value: 0 },
  { month: "T4", value: 0 },
  { month: "T5", value: 0 },
  { month: "T6", value: 0 },
];

const EMPTY_ROWS: DashboardQuickRow[] = [];

const EMPTY_QUICK_STATS: DashboardCard[] = [
  { label: "Lớp đang chạy", value: "0" },
  { label: "Yêu cầu mới", value: "0" },
  { label: "Giảng viên online", value: "0" },
  { label: "Học phí chờ", value: "₫ 0" },
];

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overviewCards, setOverviewCards] =
    useState<DashboardCard[]>(EMPTY_OVERVIEW);
  const [statCards, setStatCards] =
    useState<DashboardStatCard[]>(EMPTY_STATS);
  const [enrollmentData, setEnrollmentData] =
    useState<DashboardChartPoint[]>(EMPTY_ENROLLMENT);
  const [revenueData, setRevenueData] =
    useState<DashboardChartPoint[]>(EMPTY_REVENUE);
  const [quickRows, setQuickRows] =
    useState<DashboardQuickRow[]>(EMPTY_ROWS);
  const [quickStats, setQuickStats] =
    useState<DashboardCard[]>(EMPTY_QUICK_STATS);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await dashboardApi.getOverview(6);

        if (!mounted) return;

        setOverviewCards(
          Array.isArray(data?.overviewCards) && data.overviewCards.length
            ? data.overviewCards
            : EMPTY_OVERVIEW
        );

        setStatCards(
          Array.isArray(data?.statCards) && data.statCards.length
            ? data.statCards
            : EMPTY_STATS
        );

        setEnrollmentData(
          Array.isArray(data?.enrollmentData) && data.enrollmentData.length
            ? data.enrollmentData
            : EMPTY_ENROLLMENT
        );

        setRevenueData(
          Array.isArray(data?.revenueData) && data.revenueData.length
            ? data.revenueData
            : EMPTY_REVENUE
        );

        setQuickRows(
          Array.isArray(data?.quickRows) ? data.quickRows : EMPTY_ROWS
        );

        setQuickStats(
          Array.isArray(data?.quickStats) && data.quickStats.length
            ? data.quickStats
            : EMPTY_QUICK_STATS
        );
      } catch (error) {
        if (!mounted) return;
        setError(getErrorMessage(error, "Không tải được dữ liệu dashboard"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const chartTheme = useMemo(
    () => ({
      axis: dark ? "#94a3b8" : "#64748b",
      grid: dark ? "rgba(148,163,184,.18)" : "rgba(15,23,42,.08)",
      tooltipBg: dark ? "#0f172a" : "#ffffff",
      tooltipBorder: dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.08)",
      text: dark ? "#e5e7eb" : "#0f172a",
      bar: "#1677ff",
      line: "#14b8a6",
    }),
    [dark]
  );

  const statMap = useMemo(() => {
    return {
      students: statCards.find((x) => x.key === "students") || EMPTY_STATS[0],
      teachers: statCards.find((x) => x.key === "teachers") || EMPTY_STATS[1],
      courses: statCards.find((x) => x.key === "courses") || EMPTY_STATS[2],
      revenue: statCards.find((x) => x.key === "revenue") || EMPTY_STATS[3],
    };
  }, [statCards]);

  return (
    <div className="space-y-5">
      {error ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-medium",
            dark
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          {error}
        </div>
      ) : null}

      <section
        className={cn(
          "rounded-[30px] border p-6 shadow-sm transition-all duration-300 md:p-7",
          dark
            ? "border-white/10 bg-[#111827] shadow-black/20"
            : "border-black/8 bg-white shadow-black/5"
        )}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                dark ? "text-slate-400" : "text-slate-500"
              )}
            >
              Tổng quan hệ thống
            </p>

            <h1
              className={cn(
                "mt-2 text-[28px] font-bold tracking-tight md:text-[34px]",
                dark ? "text-white" : "text-[#0f172a]"
              )}
            >
              Dashboard quản trị
            </h1>

            <p
              className={cn(
                "mt-2 max-w-190 text-[15px] leading-6",
                dark ? "text-slate-400" : "text-slate-500"
              )}
            >
              Theo dõi học viên, giảng viên, khóa học, lớp học và doanh thu trong
              thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-130">
            {overviewCards.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border px-4 py-4",
                  dark
                    ? "border-white/10 bg-white/3"
                    : "border-black/8 bg-[#f8fbff]"
                )}
              >
                <div
                  className={cn(
                    "text-xs",
                    dark ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {item.label}
                </div>

                <div
                  className={cn(
                    "mt-2 text-[22px] font-bold",
                    dark ? "text-white" : "text-[#0f172a]"
                  )}
                >
                  {loading ? "..." : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          dark={dark}
          label={statMap.students.label}
          value={loading ? "..." : statMap.students.value}
          change={statMap.students.change}
          positive={statMap.students.positive}
          icon={Users}
          iconWrap={dark ? "bg-[#1e293b]" : "bg-[#e7f0ff]"}
          iconColor={dark ? "text-[#7eb6ff]" : "text-[#1677ff]"}
        />

        <AdminStatCard
          dark={dark}
          label={statMap.teachers.label}
          value={loading ? "..." : statMap.teachers.value}
          change={statMap.teachers.change}
          positive={statMap.teachers.positive}
          icon={UserSquare2}
          iconWrap={dark ? "bg-[#1b2d2b]" : "bg-[#e8f6f1]"}
          iconColor={dark ? "text-[#86efac]" : "text-[#22c55e]"}
        />

        <AdminStatCard
          dark={dark}
          label={statMap.courses.label}
          value={loading ? "..." : statMap.courses.value}
          change={statMap.courses.change}
          positive={statMap.courses.positive}
          icon={BookOpen}
          iconWrap={dark ? "bg-[#1b2d2b]" : "bg-[#edf8ef]"}
          iconColor={dark ? "text-[#86efac]" : "text-[#22c55e]"}
        />

        <AdminStatCard
          dark={dark}
          label={statMap.revenue.label}
          value={loading ? "..." : statMap.revenue.value}
          change={statMap.revenue.change}
          positive={statMap.revenue.positive}
          icon={DollarSign}
          iconWrap={dark ? "bg-[#1e293b]" : "bg-[#eaf1ff]"}
          iconColor={dark ? "text-[#7eb6ff]" : "text-[#1677ff]"}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminPanel dark={dark} title="Học viên đăng ký" icon={BarChart3}>
          <div className="h-90 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid
                  vertical={false}
                  stroke={chartTheme.grid}
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartTheme.axis, fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axis, fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{
                    fill: dark
                      ? "rgba(255,255,255,.03)"
                      : "rgba(15,23,42,.03)",
                  }}
                  contentStyle={{
                    borderRadius: 16,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    background: chartTheme.tooltipBg,
                    color: chartTheme.text,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill={chartTheme.bar}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel dark={dark} title="Doanh thu (triệu VNĐ)" icon={DollarSign}>
          <div className="h-90 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartTheme.axis, fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axis, fontSize: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    background: chartTheme.tooltipBg,
                    color: chartTheme.text,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartTheme.line}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.3fr_0.9fr]">
        <AdminPanel dark={dark} title="Khóa học nổi bật" icon={BookOpen}>
          <div className="space-y-4">
            {quickRows.length === 0 ? (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-10 text-center text-sm",
                  dark
                    ? "border-white/10 bg-white/2 text-slate-400"
                    : "border-black/8 bg-[#fcfdff] text-slate-500"
                )}
              >
                {loading ? "Đang tải..." : "Chưa có dữ liệu"}
              </div>
            ) : (
              quickRows.map((row, index) => (
                <div
                  key={`${row.course}-${index}`}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between",
                    dark
                      ? "border-white/10 bg-white/2"
                      : "border-black/8 bg-[#fcfdff]"
                  )}
                >
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "truncate text-[17px] font-semibold",
                        dark ? "text-white" : "text-[#0f172a]"
                      )}
                    >
                      {index + 1}. {row.course}
                    </div>

                    <div
                      className={cn(
                        "mt-1 text-sm",
                        dark ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      {row.students} học viên đăng ký
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold",
                      row.status === "Đang mở"
                        ? dark
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-emerald-100 text-emerald-700"
                        : row.status === "Sắp khai giảng"
                        ? dark
                          ? "bg-blue-500/15 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                        : dark
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {row.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel dark={dark} title="Tổng quan nhanh" icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border p-4",
                  dark
                    ? "border-white/10 bg-white/2"
                    : "border-black/8 bg-[#fcfdff]"
                )}
              >
                <div
                  className={cn(
                    "text-sm",
                    dark ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {item.label}
                </div>

                <div
                  className={cn(
                    "mt-2 text-[24px] font-bold",
                    dark ? "text-white" : "text-[#0f172a]"
                  )}
                >
                  {loading ? "..." : item.value}
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}