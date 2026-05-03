"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Globe,
  MonitorCog,
  Moon,
  Save,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import {
  STUDENT_LOCALES,
  useStudentPreferences,
  type StudentLocale,
  type StudentTheme,
} from "@/i18n";

type SettingTab = "general" | "security" | "notification";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const copy = {
  vi: {
    save: "Lưu thay đổi",
    setup: "Thiết lập",
    update: "Cập nhật",
    tabs: {
      general: "Chung",
      account: "Tài khoản",
      security: "Bảo mật",
      notification: "Thông báo",
    },
    page: {
      title: "Cài đặt học viên",
      description:
        "Quản lý giao diện, ngôn ngữ, tài khoản, bảo mật và thông báo trong khu vực học viên.",
    },
    general: {
      title: "Cài đặt chung",
      description: "Quản lý tùy chọn hiển thị dành riêng cho học viên.",
      language: "Ngôn ngữ hiển thị",
      theme: "Giao diện",
      light: "Sáng",
      dark: "Tối",
      vietnamese: "Tiếng Việt",
      english: "English",
    },
    display: {
      title: "Hiển thị",
      description: "Thiết lập giao diện và cách trang học viên trình bày dữ liệu.",
      darkMode: "Dark mode học viên",
      darkModeDescription:
        "Bật giao diện tối cho toàn bộ trang /student, độc lập với theme admin.",
      syncCalendar: "Đồng bộ lịch học",
      syncCalendarDescription:
        "Hiển thị nhanh lịch học mới nhất trong khu vực học viên.",
      showProgress: "Hiển thị tiến độ học tập",
      showProgressDescription:
        "Cho phép hiển thị phần trăm tiến độ trên bảng tin học viên.",
    },
    account: {
      title: "Thông tin tài khoản",
      description: "Cập nhật dữ liệu hiển thị của tài khoản học viên.",
      displayName: "Tên hiển thị",
      email: "Email tài khoản",
      avatar: "Link ảnh đại diện",
      phone: "Số điện thoại",
      studentCode: "Mã học viên",
    },
    password: {
      title: "Mật khẩu",
      description: "Giao diện đổi mật khẩu cho học viên.",
      current: "Mật khẩu hiện tại",
      next: "Mật khẩu mới",
      confirm: "Xác nhận mật khẩu mới",
    },
    security: {
      title: "Thiết lập bảo mật",
      description: "Quản lý phiên đăng nhập và cảnh báo bảo mật.",
      twoFactor: "Bật xác thực 2 bước",
      twoFactorDescription:
        "Yêu cầu thêm bước xác minh khi đăng nhập tài khoản học viên.",
      loginAlert: "Thông báo đăng nhập mới",
      loginAlertDescription:
        "Gửi cảnh báo khi phát hiện thiết bị hoặc vị trí đăng nhập lạ.",
      timeout: "Thời gian hết hạn phiên",
      logTitle: "Nhật ký và kiểm soát",
      logDescription: "Hiển thị nhanh trạng thái bảo mật của tài khoản học viên.",
      activeDevices: "Thiết bị đang hoạt động",
      sessions: "Phiên đăng nhập",
      lastLogin: "Lần đăng nhập gần nhất",
      today: "Hôm nay",
    },
    notification: {
      title: "Thông báo email",
      description: "Bật hoặc tắt các loại email trong khu vực học viên.",
      schedule: "Email lịch học",
      scheduleDescription: "Nhận email khi lịch học có thay đổi hoặc sắp đến giờ học.",
      grades: "Email điểm số",
      gradesDescription: "Nhận email khi có điểm hoặc nhận xét học tập mới.",
      system: "Email hệ thống",
      systemDescription: "Nhận thông báo từ hệ thống về tài khoản và cập nhật.",
    },
    placeholders: {
      displayName: "Nhập tên hiển thị",
      email: "student@example.com",
      avatar: "https://example.com/avatar.jpg",
      phone: "09xxxxxxxx",
      studentCode: "HV-0001",
    },
  },
  en: {
    save: "Save changes",
    setup: "Settings",
    update: "Update",
    tabs: {
      general: "General",
      account: "Account",
      security: "Security",
      notification: "Notifications",
    },
    page: {
      title: "Student settings",
      description:
        "Manage theme, language, account, security, and notifications in the student area.",
    },
    general: {
      title: "General settings",
      description: "Manage display preferences for the student area.",
      language: "Display language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      vietnamese: "Vietnamese",
      english: "English",
    },
    display: {
      title: "Display",
      description: "Configure how the student area presents information.",
      darkMode: "Student dark mode",
      darkModeDescription:
        "Enable dark mode across /student independently from the admin theme.",
      syncCalendar: "Sync schedule",
      syncCalendarDescription:
        "Show the latest schedule updates in the student area.",
      showProgress: "Show learning progress",
      showProgressDescription:
        "Display progress percentages on the student dashboard.",
    },
    account: {
      title: "Account information",
      description: "Update display data for the student account.",
      displayName: "Display name",
      email: "Account email",
      avatar: "Avatar URL",
      phone: "Phone number",
      studentCode: "Student code",
    },
    password: {
      title: "Password",
      description: "Password change interface for students.",
      current: "Current password",
      next: "New password",
      confirm: "Confirm new password",
    },
    security: {
      title: "Security settings",
      description: "Manage login sessions and security alerts.",
      twoFactor: "Enable two-factor authentication",
      twoFactorDescription:
        "Require an extra verification step when signing in.",
      loginAlert: "New login alerts",
      loginAlertDescription:
        "Send alerts when a new device or location signs in.",
      timeout: "Session timeout",
      logTitle: "Logs and control",
      logDescription: "Quick account security status for the student account.",
      activeDevices: "Active devices",
      sessions: "Login sessions",
      lastLogin: "Last login",
      today: "Today",
    },
    notification: {
      title: "Email notifications",
      description: "Turn student email notifications on or off.",
      schedule: "Schedule emails",
      scheduleDescription:
        "Receive email when the schedule changes or a lesson is coming up.",
      grades: "Grade emails",
      gradesDescription: "Receive email when new grades or feedback are posted.",
      system: "System emails",
      systemDescription: "Receive system notices about account and updates.",
    },
    placeholders: {
      displayName: "Enter display name",
      email: "student@example.com",
      avatar: "https://example.com/avatar.jpg",
      phone: "09xxxxxxxx",
      studentCode: "ST-0001",
    },
  },
} as const satisfies Record<StudentLocale, Record<string, unknown>>;

export default function StudentSettingsPage() {
  const { locale, setLocale, setTheme, theme, toggleTheme } =
    useStudentPreferences();
  const text = copy[locale];
  const [activeTab, setActiveTab] = useState<SettingTab>("general");

  const [syncCalendar, setSyncCalendar] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [emailSchedule, setEmailSchedule] = useState(true);
  const [emailGrades, setEmailGrades] = useState(true);
  const [emailSystem, setEmailSystem] = useState(false);

  const tabs = useMemo(
    () => [
      {
        key: "general" as const,
        label: text.tabs.general,
        icon: Settings,
      },
      {
        key: "security" as const,
        label: text.tabs.security,
        icon: ShieldCheck,
      },
      {
        key: "notification" as const,
        label: text.tabs.notification,
        icon: Bell,
      },
    ],
    [text.tabs.general, text.tabs.notification, text.tabs.security]
  );

  const languageOptions = useMemo(
    () =>
      STUDENT_LOCALES.map((item) => ({
        value: item.code,
        label: item.code === "vi" ? text.general.vietnamese : text.general.english,
      })),
    [text.general.english, text.general.vietnamese]
  );

  const themeOptions = useMemo(
    () => [
      { value: "light", label: text.general.light },
      { value: "dark", label: text.general.dark },
    ],
    [text.general.dark, text.general.light]
  );

  return (
    <main className="p-4 md:p-6">
      <section className="border border-[#cbe7fb] bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="border-b border-[#cbe7fb] bg-[#0D56A6] px-5 py-4 text-white md:px-7 dark:border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
                <Settings className="h-4 w-4" />
                {text.setup}
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                {text.page.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                {text.page.description}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#0D56A6] transition hover:bg-[#F4FAFF]"
            >
              <Save className="h-4 w-4" />
              {text.save}
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border border-[#cbe7fb] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/30">
            <div className="mb-3 px-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0D56A6] dark:text-sky-200">
                {text.setup}
              </p>
            </div>

            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition",
                      active
                        ? "bg-[#0D56A6] text-white shadow-sm"
                        : "text-slate-700 hover:bg-[#F4FAFF] dark:text-slate-200 dark:hover:bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        active
                          ? "bg-white/10"
                          : "bg-[#F4FAFF] text-[#0D56A6] dark:bg-white/10 dark:text-slate-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-sm font-semibold">{tab.label}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          active
                            ? "text-white/65"
                            : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {text.update} {tab.label.toLowerCase()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            {activeTab === "general" && (
              <>
                <SettingCard
                  icon={<MonitorCog className="h-5 w-5" />}
                  title={text.general.title}
                  description={text.general.description}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label={text.general.language}
                      value={locale}
                      onChange={(value) => setLocale(value as StudentLocale)}
                      options={languageOptions}
                    />

                    <SelectField
                      label={text.general.theme}
                      value={theme}
                      onChange={(value) => setTheme(value as StudentTheme)}
                      options={themeOptions}
                    />
                  </div>
                </SettingCard>

                <SettingCard
                  icon={<Globe className="h-5 w-5" />}
                  title={text.display.title}
                  description={text.display.description}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <ToggleRow
                      title={text.display.darkMode}
                      description={text.display.darkModeDescription}
                      enabled={theme === "dark"}
                      onChange={toggleTheme}
                    />
                    <ToggleRow
                      title={text.display.syncCalendar}
                      description={text.display.syncCalendarDescription}
                      enabled={syncCalendar}
                      onChange={() => setSyncCalendar((prev) => !prev)}
                    />
                    <ToggleRow
                      title={text.display.showProgress}
                      description={text.display.showProgressDescription}
                      enabled={showProgress}
                      onChange={() => setShowProgress((prev) => !prev)}
                    />

                    <ThemePreview
                      title={text.general.theme}
                      value={
                        theme === "dark"
                          ? text.general.dark
                          : text.general.light
                      }
                      dark={theme === "dark"}
                    />
                  </div>
                </SettingCard>
              </>
            )}

            {activeTab === "security" && (
              <>
                <SettingCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title={text.security.title}
                  description={text.security.description}
                >
                  <div className="space-y-4">
                    <ToggleRow
                      title={text.security.twoFactor}
                      description={text.security.twoFactorDescription}
                      enabled={twoFactor}
                      onChange={() => setTwoFactor((prev) => !prev)}
                    />

                    <ToggleRow
                      title={text.security.loginAlert}
                      description={text.security.loginAlertDescription}
                      enabled={loginAlert}
                      onChange={() => setLoginAlert((prev) => !prev)}
                    />

                    <SelectField
                      label={text.security.timeout}
                      value={sessionTimeout}
                      onChange={setSessionTimeout}
                      options={[
                        { label: "15 phút", value: "15" },
                        { label: "30 phút", value: "30" },
                        { label: "60 phút", value: "60" },
                        { label: "120 phút", value: "120" },
                      ]}
                    />
                  </div>
                </SettingCard>

                <SettingCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title={text.security.logTitle}
                  description={text.security.logDescription}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatBox label={text.security.activeDevices} value="2" />
                    <StatBox label={text.security.sessions} value="3" />
                    <StatBox label={text.security.lastLogin} value={text.security.today} />
                  </div>
                </SettingCard>
              </>
            )}

            {activeTab === "notification" && (
              <SettingCard
                icon={<Bell className="h-5 w-5" />}
                title={text.notification.title}
                description={text.notification.description}
              >
                <div className="space-y-4">
                  <ToggleRow
                    title={text.notification.schedule}
                    description={text.notification.scheduleDescription}
                    enabled={emailSchedule}
                    onChange={() => setEmailSchedule((prev) => !prev)}
                  />
                  <ToggleRow
                    title={text.notification.grades}
                    description={text.notification.gradesDescription}
                    enabled={emailGrades}
                    onChange={() => setEmailGrades((prev) => !prev)}
                  />
                  <ToggleRow
                    title={text.notification.system}
                    description={text.notification.systemDescription}
                    enabled={emailSystem}
                    onChange={() => setEmailSystem((prev) => !prev)}
                  />
                </div>
              </SettingCard>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function SettingCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#cbe7fb] bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/30">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4FAFF] text-[#0D56A6] ring-1 ring-[#cbe7fb] dark:bg-[#1677ff]/15 dark:text-sky-200 dark:ring-white/10">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[#cbe7fb] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#0D56A6] focus:ring-4 focus:ring-[#0D56A6]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#cbe7fb] bg-[#F8FCFF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
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

function ThemePreview({
  title,
  value,
  dark,
}: {
  title: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#cbe7fb] bg-[#F8FCFF] px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {value}
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0D56A6] ring-1 ring-[#cbe7fb] dark:bg-white/10 dark:text-sky-200 dark:ring-white/10">
        {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#cbe7fb] bg-[#F8FCFF] px-4 py-5 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
