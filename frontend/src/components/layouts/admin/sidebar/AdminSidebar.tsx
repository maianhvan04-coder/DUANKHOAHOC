"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  User,
} from "lucide-react";
import { useAdminLayout } from "@/components/layouts/admin/admin-layout-context";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const menuGroups = [
  {
    label: "HOME",
    items: [{ href: "/admin/dashboard", text: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "USER",
    items: [
      { href: "/admin/users", text: "Người dùng", icon: User },
      { href: "/admin/students", text: "Học viên", icon: Users },
      { href: "/admin/teachers", text: "Giảng viên", icon: GraduationCap },
    ],
  },
  {
    label: "GENERAL",
    items: [
      { href: "/admin/courses", text: "Khóa học", icon: BookOpen },
      { href: "/admin/schedule", text: "Lịch học", icon: CalendarDays },
    ],
  },
  {
    label: "SETTING",
    items: [{ href: "/admin/settings", text: "Cài đặt", icon: Settings }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useAdminLayout();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r transition-all duration-300",
        collapsed ? "w-24" : "w-70",
        dark ? "border-white/10 bg-[#0f172a]" : "border-black/8 bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b px-5 py-5",
          dark ? "border-white/10" : "border-black/8"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1677ff] text-white">
          <GraduationCap className="h-6 w-6" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "truncate text-[18px] font-bold",
                dark ? "text-white" : "text-[#0f172a]"
              )}
            >
              EduLearn
            </div>
            <div className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>
              Admin Panel
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition",
            dark
              ? "border-white/10 bg-white/5 text-white"
              : "border-black/8 bg-[#f8fafc] text-slate-700"
          )}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div
                  className={cn(
                    "mb-3 px-3 text-[12px] font-semibold uppercase tracking-[0.24em]",
                    dark ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {group.label}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-2xl transition-all",
                        collapsed ? "justify-center px-0 py-3.5" : "gap-3 px-4 py-3.5",
                        selected
                          ? dark
                            ? "bg-white/10 text-white"
                            : "bg-[#eef3fa] text-[#0f172a]"
                          : dark
                          ? "text-slate-300 hover:bg-white/5"
                          : "text-slate-700 hover:bg-[#f5f8fc]"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-[18px] font-medium">{item.text}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className={cn("border-t p-4", dark ? "border-white/10" : "border-black/8")}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all",
            collapsed && "justify-center px-0",
            dark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-[#f5f8fc]"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-[18px] font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}