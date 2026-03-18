"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  User,
  FolderKanban,
  Package2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminLayout } from "@/components/layouts/admin/admin-layout-context";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";
import { authApi, type AuthUser } from "@/app/api/auth.api";
import type { PermissionMetaItem, PermissionKey } from "@/app/api/rbac.api";
import { clearAuth } from "@/lib/utils/storage";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type SidebarChildItem = {
  href: string;
  text: string;
  icon: LucideIcon;
  requiredGroupKeys?: string[];
};

type SidebarItem = {
  href?: string;
  text: string;
  icon: LucideIcon;
  requiredGroupKeys?: string[];
  children?: SidebarChildItem[];
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

type AdminSidebarProps = {
  currentUser: AuthUser | null;
  permissionMeta: PermissionMetaItem[];
  grantedPermissions: PermissionKey[];
};

const menuGroups: SidebarGroup[] = [
  {
    label: "HOME",
    items: [
      {
        href: "/admin/dashboard",
        text: "Dashboard",
        icon: LayoutDashboard,
        requiredGroupKeys: ["DASHBOARD"],
      },
    ],
  },
  {
    label: "USER",
    items: [
      {
        href: "/admin/users",
        text: "Người dùng",
        icon: User,
        requiredGroupKeys: ["USERS"],
      },
      {
        href: "/admin/students",
        text: "Học viên",
        icon: Users,
        requiredGroupKeys: ["STUDENTS"],
      },
      {
        href: "/admin/teachers",
        text: "Giảng viên",
        icon: GraduationCap,
        requiredGroupKeys: ["TEACHERS"],
      },
    ],
  },
  {
    label: "GENERAL",
    items: [
      {
        text: "Khóa học",
        icon: BookOpen,
        requiredGroupKeys: ["CATEGORIES", "COURSES"],
        children: [
          {
            href: "/admin/category",
            text: "Danh mục",
            icon: FolderKanban,
            requiredGroupKeys: ["CATEGORIES"],
          },
          {
            href: "/admin/course",
            text: "Sản phẩm",
            icon: Package2,
            requiredGroupKeys: ["COURSES"],
          },
        ],
      },
      {
        href: "/admin/schedule",
        text: "Lịch học",
        icon: CalendarDays,
        requiredGroupKeys: ["SCHEDULES"],
      },
    ],
  },
  {
    label: "SETTING",
    items: [
      {
        href: "/admin/rbac",
        text: "Phân quyền",
        icon: ShieldCheck,
        requiredGroupKeys: ["SYSTEM"],
      },
      {
        href: "/admin/settings",
        text: "Cài đặt",
        icon: Settings,
        requiredGroupKeys: ["SYSTEM"],
      },
    ],
  }
];

export default function AdminSidebar({

  currentUser,
  permissionMeta,
  grantedPermissions,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed } = useAdminLayout();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "Khóa học": true,
  });

  const grantedGroupKeys = useMemo(() => {
    const grantedPermissionSet = new Set(grantedPermissions);

    return new Set(
      permissionMeta
        .filter((item) => grantedPermissionSet.has(item.key))
        .map((item) => item.groupKey)
    );
  }, [permissionMeta, grantedPermissions]);

  const visibleMenuGroups = useMemo(() => {
    const canShow = (requiredGroupKeys?: string[]) => {
      if (!requiredGroupKeys || requiredGroupKeys.length === 0) return true;
      return requiredGroupKeys.some((key) => grantedGroupKeys.has(key));
    };

    return menuGroups
      .map((group) => {
        const visibleItems = group.items
          .map((item) => {
            if (item.children?.length) {
              const visibleChildren = item.children.filter((child) =>
                canShow(child.requiredGroupKeys)
              );

              const parentVisible =
                canShow(item.requiredGroupKeys) || visibleChildren.length > 0;

              if (!parentVisible) return null;

              return {
                ...item,
                children: visibleChildren,
              };
            }

            if (!canShow(item.requiredGroupKeys)) return null;
            return item;
          })
          .filter(Boolean) as SidebarItem[];

        if (visibleItems.length === 0) return null;

        return {
          ...group,
          items: visibleItems,
        };
      })
      .filter(Boolean) as SidebarGroup[];
  }, [grantedGroupKeys]);

  const toggleSubmenu = (text: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [text]: !prev[text],
    }));
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.replace("/login");
      router.refresh();
    }
  };

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
            <div
              className={cn(
                "text-sm",
                dark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {currentUser?.name || "Admin Panel"}
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
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {visibleMenuGroups.map((group) => (
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

                  if (item.children?.length) {
                    const isOpen = !!openMenus[item.text];
                    const childActive = item.children.some((child) =>
                      pathname.startsWith(child.href)
                    );

                    return (
                      <div key={item.text}>
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed) toggleCollapsed();
                            toggleSubmenu(item.text);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-2xl transition-all",
                            collapsed
                              ? "justify-center px-0 py-3.5"
                              : "justify-between px-4 py-3.5",
                            childActive
                              ? dark
                                ? "bg-white/10 text-white"
                                : "bg-[#eef3fa] text-[#0f172a]"
                              : dark
                                ? "text-slate-300 hover:bg-white/5"
                                : "text-slate-700 hover:bg-[#f5f8fc]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center",
                              collapsed ? "justify-center" : "gap-3"
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!collapsed && (
                              <span className="text-[18px] font-medium">
                                {item.text}
                              </span>
                            )}
                          </div>

                          {!collapsed && (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-200",
                                isOpen && "rotate-180"
                              )}
                            />
                          )}
                        </button>

                        {!collapsed && isOpen && (
                          <div
                            className={cn(
                              "ml-6 mt-1 space-y-1 border-l pl-3",
                              dark ? "border-white/10" : "border-black/8"
                            )}
                          >
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const selected = pathname.startsWith(child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                                    selected
                                      ? dark
                                        ? "bg-white/10 text-white"
                                        : "bg-[#eef3fa] text-[#0f172a]"
                                      : dark
                                        ? "text-slate-300 hover:bg-white/5"
                                        : "text-slate-700 hover:bg-[#f5f8fc]"
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span className="text-[16px] font-medium">
                                    {child.text}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const selected = item.href
                    ? pathname.startsWith(item.href)
                    : false;

                  return (
                    <Link
                      key={item.href}
                      href={item.href || "#"}
                      className={cn(
                        "flex items-center rounded-2xl transition-all",
                        collapsed
                          ? "justify-center px-0 py-3.5"
                          : "gap-3 px-4 py-3.5",
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
                      {!collapsed && (
                        <span className="text-[18px] font-medium">
                          {item.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div
        className={cn("border-t p-4", dark ? "border-white/10" : "border-black/8")}
      >
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all",
            collapsed && "justify-center px-0",
            dark
              ? "text-slate-200 hover:bg-white/5"
              : "text-slate-700 hover:bg-[#f5f8fc]"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <span className="text-[18px] font-medium">Đăng xuất</span>
          )}
        </button>
      </div>
    </aside>
  );
}