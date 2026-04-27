"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Moon, Sun } from "lucide-react";
import AvatarMenu from "@/components/layouts/admin/topbar/AvatarMenu";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ADMIN_PAGE_TITLES: Array<{ path: string; title: string }> = [
  { path: "/admin/dashboard", title: "Dashboard quản trị" },
  { path: "/admin/users", title: "User Management" },
  { path: "/admin/students", title: "Student Management" },
  { path: "/admin/teachers", title: "Teacher Management" },
  { path: "/admin/course", title: "Course Management" },
  { path: "/admin/classes", title: "Quản lý lớp học" },
  { path: "/admin/category", title: "Category Management" },
  { path: "/admin/notification", title: "Trung tâm thông báo" },
  { path: "/admin/rbac", title: "Role & Permissions" },
  { path: "/admin/payment-audits", title: "Audit thanh toán" },
  { path: "/admin/security-audits", title: "Audit bảo mật" },
  { path: "/admin/setting", title: "Cài đặt" },
];

function getAdminPageTitle(pathname: string) {
  if (pathname === "/admin") return "Dashboard quản trị";

  const match = ADMIN_PAGE_TITLES.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return match?.title ?? "Admin";
}

export default function AdminTopbar() {
  const { theme, toggleTheme } = useAdminTheme();
  const pathname = usePathname();
  const dark = theme === "dark";
  const title = getAdminPageTitle(pathname);

  return (
    <header
      className={cn(
        "mb-6 rounded-[26px] border px-4 py-4 shadow-sm md:px-5",
        dark
          ? "border-white/10 bg-[#111827] shadow-black/20"
          : "border-black/8 bg-white shadow-black/5"
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <h1
          className={cn(
            "min-w-0 truncate text-xl font-bold tracking-tight md:text-2xl",
            dark ? "text-white" : "text-slate-950"
          )}
        >
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border transition",
              dark
                ? "border-white/10 bg-white/5 text-white"
                : "border-black/8 bg-white text-slate-700"
            )}
            aria-label={dark ? "Chuyển sang light mode" : "Chuyển sang dark mode"}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link
            href="/admin/notification"
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-full border transition",
              dark
                ? "border-white/10 bg-white/5 text-white"
                : "border-black/8 bg-white text-slate-700"
            )}
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#1677ff]" />
          </Link>
          </div>

          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
