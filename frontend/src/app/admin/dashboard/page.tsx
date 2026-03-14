"use client";

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

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const enrollmentData = [
  { month: "T1", value: 450 },
  { month: "T2", value: 520 },
  { month: "T3", value: 680 },
  { month: "T4", value: 590 },
  { month: "T5", value: 720 },
  { month: "T6", value: 860 },
];

const revenueData = [
  { month: "T1", value: 180 },
  { month: "T2", value: 220 },
  { month: "T3", value: 310 },
  { month: "T4", value: 280 },
  { month: "T5", value: 350 },
  { month: "T6", value: 420 },
];

const quickRows = [
  { course: "ReactJS từ cơ bản đến nâng cao", students: 128, status: "Đang mở" },
  { course: "Node.js API thực chiến", students: 96, status: "Sắp khai giảng" },
  { course: "UI/UX cho web học tập", students: 74, status: "Đang mở" },
  { course: "MongoDB & Mongoose", students: 61, status: "Tạm đóng" },
];

const overviewCards = [
  { label: "Khóa học hoạt động", value: "42" },
  { label: "Lớp hôm nay", value: "18" },
  { label: "Giảng viên online", value: "34" },
  { label: "Yêu cầu mới", value: "12" },
];

const quickStats = [
  { label: "Lớp đang chạy", value: "42" },
  { label: "Yêu cầu mới", value: "18" },
  { label: "Giảng viên online", value: "34" },
  { label: "Học phí chờ", value: "₫ 120M" },
];

export default function DashboardPage() {
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  const chartTheme = {
    axis: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "rgba(148,163,184,.18)" : "rgba(15,23,42,.08)",
    tooltipBg: dark ? "#0f172a" : "#ffffff",
    tooltipBorder: dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.08)",
    text: dark ? "#e5e7eb" : "#0f172a",
    bar: "#1677ff",
    line: "#14b8a6",
  };

  return (
    <div className="space-y-5">
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
            <p className={cn("text-sm font-medium", dark ? "text-slate-400" : "text-slate-500")}>
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
              Theo dõi học viên, giảng viên, khóa học, lớp học và doanh thu trong thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-130">
            {overviewCards.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border px-4 py-4",
                  dark ? "border-white/10 bg-white/3" : "border-black/8 bg-[#f8fbff]"
                )}
              >
                <div className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>
                  {item.label}
                </div>

                <div
                  className={cn(
                    "mt-2 text-[22px] font-bold",
                    dark ? "text-white" : "text-[#0f172a]"
                  )}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          dark={dark}
          label="Tổng học viên"
          value="10,234"
          change="+12%"
          icon={Users}
          iconWrap={dark ? "bg-[#1e293b]" : "bg-[#e7f0ff]"}
          iconColor={dark ? "text-[#7eb6ff]" : "text-[#1677ff]"}
        />

        <AdminStatCard
          dark={dark}
          label="Giảng viên"
          value="156"
          change="+5%"
          icon={UserSquare2}
          iconWrap={dark ? "bg-[#1b2d2b]" : "bg-[#e8f6f1]"}
          iconColor={dark ? "text-[#86efac]" : "text-[#22c55e]"}
        />

        <AdminStatCard
          dark={dark}
          label="Khóa học"
          value="524"
          change="+18%"
          icon={BookOpen}
          iconWrap={dark ? "bg-[#1b2d2b]" : "bg-[#edf8ef]"}
          iconColor={dark ? "text-[#86efac]" : "text-[#22c55e]"}
        />

        <AdminStatCard
          dark={dark}
          label="Doanh thu"
          value="₫ 2.5 tỷ"
          change="-3%"
          positive={false}
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
                <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="4 4" />
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
                    fill: dark ? "rgba(255,255,255,.03)" : "rgba(15,23,42,.03)",
                  }}
                  contentStyle={{
                    borderRadius: 16,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    background: chartTheme.tooltipBg,
                    color: chartTheme.text,
                  }}
                />
                <Bar dataKey="value" fill={chartTheme.bar} radius={[8, 8, 0, 0]} maxBarSize={48} />
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
                <Line type="monotone" dataKey="value" stroke={chartTheme.line} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.3fr_0.9fr]">
        <AdminPanel dark={dark} title="Khóa học nổi bật" icon={BookOpen}>
          <div className="space-y-4">
            {quickRows.map((row, index) => (
              <div
                key={row.course}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between",
                  dark ? "border-white/10 bg-white/2" : "border-black/8 bg-[#fcfdff]"
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

                  <div className={cn("mt-1 text-sm", dark ? "text-slate-400" : "text-slate-500")}>
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
            ))}
          </div>
        </AdminPanel>

        <AdminPanel dark={dark} title="Tổng quan nhanh" icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border p-4",
                  dark ? "border-white/10 bg-white/2" : "border-black/8 bg-[#fcfdff]"
                )}
              >
                <div className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
                  {item.label}
                </div>

                <div
                  className={cn(
                    "mt-2 text-[24px] font-bold",
                    dark ? "text-white" : "text-[#0f172a]"
                  )}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}