"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type NotificationItem = {
  id: number;
  title: string;
  desc: string;
  time: string;
  href: string;
  read: boolean;
  type: "payment" | "security" | "system" | "audit";
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Có thanh toán mới",
    desc: "Học viên Nguyễn Văn A vừa thanh toán khóa học IELTS Foundation.",
    time: "2 phút trước",
    href: "/admin/payment-audits",
    read: false,
    type: "payment",
  },
  {
    id: 2,
    title: "Cảnh báo bảo mật",
    desc: "Phát hiện đăng nhập từ thiết bị mới trong hệ thống quản trị.",
    time: "10 phút trước",
    href: "/admin/security-audits",
    read: false,
    type: "security",
  },
  {
    id: 3,
    title: "Audit thanh toán cập nhật",
    desc: "Đơn hàng #502603708937 đã được đánh dấu thanh toán thành công.",
    time: "30 phút trước",
    href: "/admin/payment-audits",
    read: true,
    type: "audit",
  },
  {
    id: 4,
    title: "Sao lưu dữ liệu thành công",
    desc: "Hệ thống đã sao lưu dữ liệu định kỳ thành công lúc 01:00.",
    time: "1 giờ trước",
    href: "/admin/setting",
    read: true,
    type: "system",
  },
  {
    id: 5,
    title: "Có yêu cầu cập nhật phân quyền",
    desc: "Một quản trị viên vừa gửi yêu cầu thay đổi quyền truy cập.",
    time: "Hôm nay, 08:15",
    href: "/admin/rbac",
    read: false,
    type: "security",
  },
];

function getNotificationMeta(type: NotificationItem["type"]) {
  switch (type) {
    case "payment":
      return {
        icon: CreditCard,
        iconWrap: "bg-emerald-500/10 text-emerald-500",
        badge: "Thanh toán",
        badgeClass: "bg-emerald-500/10 text-emerald-600",
      };
    case "security":
      return {
        icon: ShieldAlert,
        iconWrap: "bg-rose-500/10 text-rose-500",
        badge: "Bảo mật",
        badgeClass: "bg-rose-500/10 text-rose-600",
      };
    case "audit":
      return {
        icon: FileText,
        iconWrap: "bg-amber-500/10 text-amber-500",
        badge: "Audit",
        badgeClass: "bg-amber-500/10 text-amber-600",
      };
    default:
      return {
        icon: Settings,
        iconWrap: "bg-sky-500/10 text-sky-500",
        badge: "Hệ thống",
        badgeClass: "bg-sky-500/10 text-sky-600",
      };
  }
}

export default function AdminNotificationsPage() {
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (tab === "unread") {
      return notifications.filter((item) => !item.read);
    }
    return notifications;
  }, [notifications, tab]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const markOneAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[28px] border p-5 md:p-6",
          dark
            ? "border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_100%)]"
            : "border-black/8 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)]"
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1677ff] text-white shadow-[0_12px_28px_rgba(22,119,255,0.28)]">
              <Bell className="h-7 w-7" />
            </div>

            <div>
              <h1
                className={cn(
                  "text-2xl font-bold",
                  dark ? "text-white" : "text-slate-900"
                )}
              >
                Thông báo
              </h1>
              <p
                className={cn(
                  "mt-1 text-sm",
                  dark ? "text-slate-400" : "text-slate-500"
                )}
              >
                Quản lý thông báo thanh toán, bảo mật và hoạt động hệ thống.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                dark
                  ? "bg-white/5 text-white"
                  : "bg-[#eff6ff] text-[#1677ff]"
              )}
            >
              {unreadCount} chưa đọc
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-2xl bg-[#1677ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f6ae8]"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div
          className={cn(
            "rounded-[24px] border p-5",
            dark ? "border-white/10 bg-[#111827]" : "border-black/8 bg-white"
          )}
        >
          <p className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
            Tổng thông báo
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold",
              dark ? "text-white" : "text-slate-900"
            )}
          >
            {notifications.length}
          </p>
        </div>

        <div
          className={cn(
            "rounded-[24px] border p-5",
            dark ? "border-white/10 bg-[#111827]" : "border-black/8 bg-white"
          )}
        >
          <p className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
            Chưa đọc
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1677ff]">{unreadCount}</p>
        </div>

        <div
          className={cn(
            "rounded-[24px] border p-5",
            dark ? "border-white/10 bg-[#111827]" : "border-black/8 bg-white"
          )}
        >
          <p className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
            Đã đọc
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold",
              dark ? "text-white" : "text-slate-900"
            )}
          >
            {notifications.length - unreadCount}
          </p>
        </div>
      </section>

      <section
        className={cn(
          "rounded-[28px] border p-4 md:p-5",
          dark ? "border-white/10 bg-[#111827]" : "border-black/8 bg-white"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "all"
                  ? "bg-[#1677ff] text-white"
                  : dark
                    ? "text-slate-300 hover:bg-white/5"
                    : "text-slate-600 hover:bg-white"
              )}
            >
              Tất cả
            </button>

            <button
              type="button"
              onClick={() => setTab("unread")}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "unread"
                  ? "bg-[#1677ff] text-white"
                  : dark
                    ? "text-slate-300 hover:bg-white/5"
                    : "text-slate-600 hover:bg-white"
              )}
            >
              Chưa đọc
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {visibleNotifications.length === 0 ? (
            <div
              className={cn(
                "rounded-[24px] border border-dashed p-10 text-center",
                dark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"
              )}
            >
              Không có thông báo nào.
            </div>
          ) : (
            visibleNotifications.map((item) => {
              const meta = getNotificationMeta(item.type);
              const Icon = meta.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[24px] border p-4 transition",
                    dark
                      ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        meta.iconWrap
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={cn(
                            "text-[15px] font-bold",
                            dark ? "text-white" : "text-slate-900"
                          )}
                        >
                          {item.title}
                        </h3>

                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            meta.badgeClass
                          )}
                        >
                          {meta.badge}
                        </span>

                        {!item.read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#1677ff]" />
                        )}
                      </div>

                      <p
                        className={cn(
                          "mt-2 text-sm leading-6",
                          dark ? "text-slate-400" : "text-slate-600"
                        )}
                      >
                        {item.desc}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-xs",
                            dark ? "text-slate-500" : "text-slate-400"
                          )}
                        >
                          {item.time}
                        </span>

                        <div className="flex items-center gap-2">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() => markOneAsRead(item.id)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                                dark
                                  ? "bg-white/5 text-slate-200 hover:bg-white/10"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              )}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Đã đọc
                            </button>
                          )}

                          <Link
                            href={item.href}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#1677ff] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f6ae8]"
                          >
                            Xem chi tiết
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}