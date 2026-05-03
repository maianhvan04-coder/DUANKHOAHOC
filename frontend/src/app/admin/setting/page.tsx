"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Globe,
  KeyRound,
  MonitorCog,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useAdminPreferences, type AdminLocale } from "@/i18n";

type SettingTab = "general" | "account" | "security" | "notification";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminSettingsPage() {
  const { locale, setLocale } = useAdminPreferences();
  const [activeTab, setActiveTab] = useState<SettingTab>("general");

  const [siteName, setSiteName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");

  const [displayName, setDisplayName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [emailOrder, setEmailOrder] = useState(true);
  const [emailAudit, setEmailAudit] = useState(true);
  const [emailSystem, setEmailSystem] = useState(false);

  const tabs = useMemo(
    () => [
      {
        key: "general" as const,
        label: "Chung",
        icon: Settings,
      },
      {
        key: "account" as const,
        label: "Tài khoản",
        icon: UserCog,
      },
      {
        key: "security" as const,
        label: "Bảo mật",
        icon: ShieldCheck,
      },
      {
        key: "notification" as const,
        label: "Thông báo",
        icon: Bell,
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6 dark:bg-transparent">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                <Settings className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Cài đặt
                </h1>
                <p className="mt-1 text-sm text-white/70 md:text-[15px]">
                  Quản lý thông tin hệ thống, tài khoản quản trị, bảo mật và thông báo.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1677ff] px-5 text-sm font-semibold text-white transition hover:bg-[#0f6ae8]"
            >
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-3 px-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Thiết lập
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
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                      active
                        ? "bg-[linear-gradient(135deg,#081225_0%,#0f1f43_100%)] text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] dark:shadow-black/30"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        active ? "bg-white/10" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-sm font-semibold">{tab.label}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          active ? "text-white/65" : "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        Cập nhật {tab.label.toLowerCase()}
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
                  title="Cài đặt chung"
                  description="Quản lý thông tin cơ bản của hệ thống."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Tên hệ thống"
                      placeholder="Nhập tên hệ thống"
                      value={siteName}
                      onChange={setSiteName}
                    />
                    <Field
                      label="Email hỗ trợ"
                      placeholder="support@example.com"
                      value={supportEmail}
                      onChange={setSupportEmail}
                    />
                    <Field
                      label="Số điện thoại"
                      placeholder="1900xxxx"
                      value={phone}
                      onChange={setPhone}
                    />

                    <SelectField
                      label="Múi giờ"
                      value={timezone}
                      onChange={setTimezone}
                      options={[
                        { label: "Asia/Ho_Chi_Minh", value: "Asia/Ho_Chi_Minh" },
                        { label: "UTC", value: "UTC" },
                        { label: "Asia/Bangkok", value: "Asia/Bangkok" },
                      ]}
                    />

                    <SelectField
                      label="Ngôn ngữ mặc định"
                      value={locale}
                      onChange={(value) => {
                        if (value === "vi" || value === "en") {
                          setLocale(value as AdminLocale);
                        }
                      }}
                      options={[
                        { label: "Tiếng Việt", value: "vi" },
                        { label: "English", value: "en" },
                      ]}
                    />
                  </div>
                </SettingCard>

                <SettingCard
                  icon={<Globe className="h-5 w-5" />}
                  title="Hiển thị"
                  description="Thiết lập giao diện và hành vi hiển thị chung."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <ToggleRow
                      title="Hiển thị trạng thái hệ thống"
                      description="Cho phép hiển thị trạng thái hoạt động ngoài trang quản trị."
                      enabled={true}
                      onChange={() => undefined}
                    />
                    <ToggleRow
                      title="Tự động làm mới dashboard"
                      description="Bảng điều khiển sẽ tự làm mới dữ liệu theo chu kỳ."
                      enabled={false}
                      onChange={() => undefined}
                    />
                  </div>
                </SettingCard>
              </>
            )}

            {activeTab === "account" && (
              <>
                <SettingCard
                  icon={<UserCog className="h-5 w-5" />}
                  title="Thông tin tài khoản"
                  description="Cập nhật dữ liệu hiển thị của tài khoản quản trị."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Tên hiển thị"
                      placeholder="Nhập tên hiển thị"
                      value={displayName}
                      onChange={setDisplayName}
                    />
                    <Field
                      label="Email tài khoản"
                      placeholder="admin@example.com"
                      value={accountEmail}
                      onChange={setAccountEmail}
                    />
                    <div className="md:col-span-2">
                      <Field
                        label="Link ảnh đại diện"
                        placeholder="https://example.com/avatar.jpg"
                        value={avatar}
                        onChange={setAvatar}
                      />
                    </div>
                  </div>
                </SettingCard>

                <SettingCard
                  icon={<KeyRound className="h-5 w-5" />}
                  title="Mật khẩu"
                  description="Giao diện đổi mật khẩu cho quản trị viên."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <PasswordField label="Mật khẩu hiện tại" />
                    <PasswordField label="Mật khẩu mới" />
                    <PasswordField label="Xác nhận mật khẩu mới" />
                  </div>
                </SettingCard>
              </>
            )}

            {activeTab === "security" && (
              <>
                <SettingCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Thiết lập bảo mật"
                  description="Quản lý phiên đăng nhập và xác thực nâng cao."
                >
                  <div className="space-y-4">
                    <ToggleRow
                      title="Bật xác thực 2 bước"
                      description="Yêu cầu thêm bước xác minh khi đăng nhập tài khoản admin."
                      enabled={twoFactor}
                      onChange={() => setTwoFactor((prev) => !prev)}
                    />

                    <ToggleRow
                      title="Thông báo đăng nhập mới"
                      description="Gửi cảnh báo khi phát hiện thiết bị hoặc vị trí đăng nhập lạ."
                      enabled={loginAlert}
                      onChange={() => setLoginAlert((prev) => !prev)}
                    />

                    <SelectField
                      label="Thời gian hết hạn phiên"
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
                  title="Nhật ký và kiểm soát"
                  description="Hiển thị nhanh trạng thái giám sát bảo mật."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatBox label="Thiết bị đang hoạt động" value="3" />
                    <StatBox label="Phiên đăng nhập" value="5" />
                    <StatBox label="Lần đăng nhập gần nhất" value="Hôm nay" />
                  </div>
                </SettingCard>
              </>
            )}

            {activeTab === "notification" && (
              <>
                <SettingCard
                  icon={<Bell className="h-5 w-5" />}
                  title="Thông báo email"
                  description="Bật hoặc tắt các loại email quản trị."
                >
                  <div className="space-y-4">
                    <ToggleRow
                      title="Email đơn hàng"
                      description="Nhận email khi có thanh toán hoặc đơn hàng mới."
                      enabled={emailOrder}
                      onChange={() => setEmailOrder((prev) => !prev)}
                    />
                    <ToggleRow
                      title="Email kiểm tra thanh toán"
                      description="Nhận email khi có thay đổi bất thường ở thanh toán."
                      enabled={emailAudit}
                      onChange={() => setEmailAudit((prev) => !prev)}
                    />
                    <ToggleRow
                      title="Email hệ thống"
                      description="Nhận thông báo từ hệ thống về lỗi hoặc cập nhật."
                      enabled={emailSystem}
                      onChange={() => setEmailSystem((prev) => !prev)}
                    />
                  </div>
                </SettingCard>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-slate-950/50">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1677ff] dark:bg-[#1677ff]/15 dark:text-sky-200">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1677ff] focus:ring-4 focus:ring-[#1677ff]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
  );
}

function PasswordField({ label }: { label: string }) {
  const [value, setValue] = useState("");

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="••••••••"
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1677ff] focus:ring-4 focus:ring-[#1677ff]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </label>
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
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#1677ff] focus:ring-4 focus:ring-[#1677ff]/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative h-7 w-12 rounded-full transition",
          enabled ? "bg-[#1677ff]" : "bg-slate-300 dark:bg-slate-700"
        )}
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

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
