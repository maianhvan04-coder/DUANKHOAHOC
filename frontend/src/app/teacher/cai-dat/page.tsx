"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  Mail,
  MonitorCog,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TeacherSettingsPage() {
  const { user } = useAuth();
  const [scheduleEmail, setScheduleEmail] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [compactTable, setCompactTable] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0D56A6] dark:text-sky-200">
              Thiết lập
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              Cài đặt giáo viên
            </h2>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4B92]"
          >
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UserRound className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
            {user?.name || "Giáo viên"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{user?.email || "--"}</p>

          <div className="mt-6 space-y-3">
            <InfoRow label="Vai trò" value="Giáo viên" />
            <InfoRow label="Khu vực" value="/teacher" />
            <InfoRow label="Trạng thái" value="Đang hoạt động" />
          </div>
        </aside>

        <section className="space-y-5">
          <SettingBlock
            icon={<MonitorCog className="h-5 w-5" />}
            title="Hiển thị"
          >
            <ToggleRow
              title="Bảng lớp học gọn"
              description="Giảm khoảng cách dòng khi xem nhiều lớp học."
              enabled={compactTable}
              onChange={() => setCompactTable((prev) => !prev)}
            />
          </SettingBlock>

          <SettingBlock icon={<Bell className="h-5 w-5" />} title="Thông báo">
            <ToggleRow
              title="Email lịch dạy"
              description="Nhận email khi lớp học hoặc lịch dạy thay đổi."
              enabled={scheduleEmail}
              onChange={() => setScheduleEmail((prev) => !prev)}
            />
            <ToggleRow
              title="Email thông báo"
              description="Nhận email khi trung tâm gửi thông báo mới."
              enabled={notificationEmail}
              onChange={() => setNotificationEmail((prev) => !prev)}
            />
          </SettingBlock>

          <SettingBlock icon={<ShieldCheck className="h-5 w-5" />} title="Bảo mật">
            <ToggleRow
              title="Cảnh báo đăng nhập"
              description="Nhận cảnh báo khi tài khoản đăng nhập trên thiết bị mới."
              enabled={loginAlert}
              onChange={() => setLoginAlert((prev) => !prev)}
            />
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#0D56A6] dark:text-sky-200" />
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">
                    Email tài khoản
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {user?.email || "--"}
                  </p>
                </div>
              </div>
            </div>
          </SettingBlock>
        </section>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-950 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function SettingBlock({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-sky-500/15 dark:text-sky-200">
          {icon}
        </span>
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-950 dark:text-white">
          {title}
        </p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          enabled ? "bg-[#0D56A6]" : "bg-slate-300 dark:bg-slate-700"
        )}
        aria-pressed={enabled}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            enabled ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}
