"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderKanban,
  FolderLock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Package2,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminLayout } from "@/components/layouts/admin/admin-layout-context";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";
import { authApi, type AuthUser, type Role } from "@/app/api/auth.api";
import type { PermissionMetaItem, PermissionKey } from "@/app/api/rbac.api";
import { clearAuth } from "@/lib/utils/storage";
import { useAdminPreferences, type AdminMessageKey } from "@/i18n";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type SidebarChildItem = {
  href: string;
  textKey: AdminMessageKey;
  icon: LucideIcon;
  requiredGroupKeys?: string[];
  requiredRolesAny?: Role[];
};

type SidebarItem = {
  href?: string;
  textKey: AdminMessageKey;
  icon: LucideIcon;
  requiredGroupKeys?: string[];
  requiredRolesAny?: Role[];
  children?: SidebarChildItem[];
};

type SidebarGroup = {
  labelKey: AdminMessageKey;
  items: SidebarItem[];
};

type AdminSidebarProps = {
  currentUser: AuthUser | null;
  currentRole?: Role | null;
  permissionMeta: PermissionMetaItem[];
  grantedPermissions: PermissionKey[];
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TEACHER: "Teacher",
  STUDENT: "Student",
  USER: "User",
};

const menuGroups: SidebarGroup[] = [
  {
    labelKey: "sidebar.group.home",
    items: [
      {
        href: "/admin/dashboard",
        textKey: "sidebar.dashboard",
        icon: LayoutDashboard,
        requiredGroupKeys: ["DASHBOARD"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.user",
    items: [
      {
        href: "/admin/users",
        textKey: "sidebar.users",
        icon: User,
        requiredGroupKeys: ["USERS"],
      },
      {
        href: "/admin/students",
        textKey: "sidebar.students",
        icon: Users,
        requiredGroupKeys: ["STUDENTS"],
      },
      {
        href: "/admin/teachers",
        textKey: "sidebar.teachers",
        icon: GraduationCap,
        requiredGroupKeys: ["TEACHERS"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.general",
    items: [
      {
        textKey: "sidebar.courses",
        icon: BookOpen,
        requiredGroupKeys: ["CATEGORIES", "COURSES"],
        children: [
          {
            href: "/admin/category",
            textKey: "sidebar.categories",
            icon: FolderKanban,
            requiredGroupKeys: ["CATEGORIES"],
          },
          {
            href: "/admin/course",
            textKey: "sidebar.products",
            icon: Package2,
            requiredGroupKeys: ["COURSES"],
          },
        ],
      },
    ],
  },
  {
    labelKey: "sidebar.group.posts",
    items: [
      {
        href: "/admin/blog",
        textKey: "sidebar.blog",
        icon: FileText,
        requiredGroupKeys: ["BLOGS"],
        requiredRolesAny: ["ADMIN"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.study",
    items: [
      {
        href: "/admin/classes",
        textKey: "sidebar.classes",
        icon: NotebookPen,
        requiredGroupKeys: ["CLASSROOMS"],
      },
      {
        href: "/admin/schedule",
        textKey: "sidebar.schedule",
        icon: CalendarDays,
        requiredGroupKeys: ["SCHEDULES"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.notifications",
    items: [
      {
        href: "/admin/notification",
        textKey: "sidebar.createNotification",
        icon: Bell,
        requiredGroupKeys: ["NOTIFICATIONS"],
        requiredRolesAny: ["ADMIN", "MANAGER", "TEACHER"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.audit",
    items: [
      {
        href: "/admin/sent-notifications",
        textKey: "sidebar.notificationHistory",
        icon: Bell,
        requiredGroupKeys: ["NOTIFICATIONS"],
        requiredRolesAny: ["ADMIN", "MANAGER", "TEACHER"],
      },
      {
        href: "/admin/payment-audits",
        textKey: "sidebar.paymentHistory",
        icon: CreditCard,
        requiredGroupKeys: ["AUDIT"],
      },
      {
        href: "/admin/security-audits",
        textKey: "sidebar.securityHistory",
        icon: FolderLock,
        requiredGroupKeys: ["AUDIT"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.setting",
    items: [
      {
        href: "/admin/rbac",
        textKey: "sidebar.rbac",
        icon: ShieldCheck,
        requiredGroupKeys: ["SYSTEM"],
      },
      {
        href: "/admin/setting",
        textKey: "sidebar.settings",
        icon: Settings,
        requiredGroupKeys: ["SYSTEM"],
      },
    ],
  },
];

export default function AdminSidebar({
  currentUser,
  currentRole,
  permissionMeta,
  grantedPermissions,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed } = useAdminLayout();
  const { theme } = useAdminTheme();
  const { t } = useAdminPreferences();
  const dark = theme === "dark";

  const sidebarRef = useRef<HTMLElement | null>(null);
  const [showToggleButton, setShowToggleButton] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "sidebar.courses": false,
  });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!sidebarRef.current) return;
      if (sidebarRef.current.contains(event.target as Node)) return;
      setShowToggleButton(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const grantedGroupKeys = useMemo(() => {
    const grantedPermissionSet = new Set(grantedPermissions);

    return new Set(
      permissionMeta
        .filter((item) => grantedPermissionSet.has(item.key))
        .map((item) => item.groupKey)
    );
  }, [permissionMeta, grantedPermissions]);

  const visibleMenuGroups = useMemo(() => {
    const canShow = (
      requiredGroupKeys?: string[],
      requiredRolesAny?: Role[]
    ) => {
      const matchGroup =
        !requiredGroupKeys || requiredGroupKeys.length === 0
          ? false
          : requiredGroupKeys.some((key) => grantedGroupKeys.has(key));

      const matchRole =
        !requiredRolesAny || requiredRolesAny.length === 0
          ? false
          : !!currentRole && requiredRolesAny.includes(currentRole);

      if (
        (!requiredGroupKeys || requiredGroupKeys.length === 0) &&
        (!requiredRolesAny || requiredRolesAny.length === 0)
      ) {
        return true;
      }

      return matchGroup || matchRole;
    };

    return menuGroups
      .map((group) => {
        const visibleItems = group.items
          .map((item) => {
            if (item.children?.length) {
              const visibleChildren = item.children.filter((child) =>
                canShow(child.requiredGroupKeys, child.requiredRolesAny)
              );

              const parentVisible =
                canShow(item.requiredGroupKeys, item.requiredRolesAny) ||
                visibleChildren.length > 0;

              if (!parentVisible) return null;

              return {
                ...item,
                children: visibleChildren,
              };
            }

            if (!canShow(item.requiredGroupKeys, item.requiredRolesAny)) {
              return null;
            }

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
  }, [currentRole, grantedGroupKeys]);

  const toggleSubmenu = (textKey: AdminMessageKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [textKey]: !prev[textKey],
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
      ref={sidebarRef}
      onMouseEnter={() => setShowToggleButton(true)}
      onMouseLeave={() => setShowToggleButton(false)}
      onTouchStart={() => setShowToggleButton(true)}
      onFocusCapture={() => setShowToggleButton(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
          setShowToggleButton(false);
        }
      }}
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-visible transition-all duration-300",
        collapsed ? "w-24" : "w-[280px]",
        dark
          ? "bg-[linear-gradient(180deg,#071224_0%,#0a1730_100%)]"
          : "bg-white"
      )}
    >
      <div className="relative px-4 py-4">
        <div
          title={currentUser?.name || t("common.admin")}
          className={cn(
            "flex items-center rounded-[28px] transition-all duration-300",
            collapsed
              ? "h-20 justify-center bg-transparent px-0 py-0"
              : dark
                ? "min-w-0 gap-3 bg-white/[0.04] px-3 py-3 shadow-[0_12px_30px_rgba(2,6,23,0.22)]"
                : "min-w-0 gap-3 bg-[#f8fbff] px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          )}
        >
          <Image
            src="/Logo.png"
            alt="EduLearn"
            width={56}
            height={56}
            priority
            className="h-14 w-14 shrink-0 rounded-[20px] object-cover"
          />

          {!collapsed && (
            <div className="min-w-0">
              <div
                className={cn(
                  "truncate text-[17px] font-extrabold tracking-[0.01em]",
                  dark ? "text-white" : "text-slate-900"
                )}
              >
                Edu-Learn
              </div>

              <div
                className={cn(
                  "mt-1 text-[14px] font-medium",
                  dark ? "text-slate-400" : "text-slate-500"
                )}
              >
                {currentRole ? ROLE_LABELS[currentRole] : "User"}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            toggleCollapsed();
            setShowToggleButton(true);
          }}
          className={cn(
            "absolute top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200",
            collapsed ? "right-[-12px] h-11 w-11" : "right-[-14px] h-11 w-11",
            showToggleButton
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none translate-x-1 opacity-0",
            dark
              ? "bg-[#e9edf3] text-slate-700 shadow-[0_10px_24px_rgba(2,6,23,0.22)] hover:bg-white"
              : "bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.16)] hover:bg-slate-50"
          )}
          aria-label={
            collapsed ? t("common.openSidebar") : t("common.closeSidebar")
          }
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
            <div key={group.labelKey}>
              {!collapsed && (
                <div
                  className={cn(
                    "mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em]",
                    dark ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {t(group.labelKey)}
                </div>
              )}

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (item.children?.length) {
                    const isOpen = !!openMenus[item.textKey];
                    const childActive = item.children.some((child) =>
                      pathname.startsWith(child.href)
                    );

                    return (
                      <div key={item.textKey}>
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed) toggleCollapsed();
                            toggleSubmenu(item.textKey);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-2xl transition-all duration-200",
                            collapsed
                              ? "justify-center px-0 py-3.5"
                              : "justify-between px-4 py-3.5",
                            childActive
                              ? dark
                                ? "bg-white/10 text-white"
                                : "bg-[#eef4ff] text-[#0f172a]"
                              : dark
                                ? "text-slate-300 hover:bg-white/5"
                                : "text-slate-700 hover:bg-[#f6f9fc]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center",
                              collapsed ? "justify-center" : "gap-3"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl",
                                childActive
                                  ? dark
                                    ? "bg-white/10"
                                    : "bg-white text-[#1677ff] shadow-sm"
                                  : dark
                                    ? "bg-white/5"
                                    : "bg-slate-100 text-slate-600"
                              )}
                            >
                              <Icon className="h-[18px] w-[18px] shrink-0" />
                            </span>

                            {!collapsed && (
                              <span className="text-[15px] font-medium">
                                {t(item.textKey)}
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
                          <div className="ml-6 mt-2 space-y-1.5 pl-3">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const selected = pathname.startsWith(child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                                    selected
                                      ? dark
                                        ? "bg-white/10 text-white"
                                        : "bg-[#eef4ff] text-[#0f172a]"
                                      : dark
                                        ? "text-slate-300 hover:bg-white/5"
                                        : "text-slate-700 hover:bg-[#f6f9fc]"
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span className="text-[14px] font-medium">
                                    {t(child.textKey)}
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
                        "flex items-center rounded-2xl transition-all duration-200",
                        collapsed
                          ? "justify-center px-0 py-3.5"
                          : "gap-3 px-4 py-3.5",
                        selected
                          ? dark
                            ? "bg-white/10 text-white"
                            : "bg-[#eef4ff] text-[#0f172a]"
                          : dark
                            ? "text-slate-300 hover:bg-white/5"
                            : "text-slate-700 hover:bg-[#f6f9fc]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          selected
                            ? dark
                              ? "bg-white/10"
                              : "bg-white text-[#1677ff] shadow-sm"
                            : dark
                              ? "bg-white/5"
                              : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>

                      {!collapsed && (
                        <span className="text-[15px] font-medium">
                          {t(item.textKey)}
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

      <div className="p-4">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-2xl transition-all duration-200",
            collapsed ? "justify-center px-0 py-3.5" : "gap-3 px-4 py-3.5",
            dark
              ? "text-slate-200 hover:bg-white/5"
              : "text-slate-700 hover:bg-[#f6f9fc]"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              dark ? "bg-white/5" : "bg-slate-100 text-slate-600"
            )}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </span>

          {!collapsed && (
            <span className="text-[15px] font-medium">
              {t("common.logout")}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
