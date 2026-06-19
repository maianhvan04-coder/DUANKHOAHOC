"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  FolderKanban,
  FolderLock,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  ShieldCheck,
  User,
  Users,
  WalletCards,
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

function isActiveHref(pathname: string, href: string) {
  if (href === "/admin/course" || href === "/admin/blog") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
    labelKey: "sidebar.group.course",
    items: [
      {
        href: "/admin/course/categories",
        textKey: "sidebar.categories",
        icon: FolderKanban,
        requiredGroupKeys: ["CATEGORIES"],
      },
      {
        href: "/admin/course",
        textKey: "sidebar.courses",
        icon: BookOpen,
        requiredGroupKeys: ["COURSES"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.posts",
    items: [
      {
        href: "/admin/blog/categories",
        textKey: "sidebar.categories",
        icon: FolderKanban,
        requiredGroupKeys: ["BLOGS"],
        requiredRolesAny: ["ADMIN"],
      },
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
    labelKey: "sidebar.group.bank",
    items: [
      {
        href: "/admin/payment-methods",
        textKey: "sidebar.paymentMethods",
        icon: Landmark,
        requiredGroupKeys: ["PAYMENT_METHODS"],
        requiredRolesAny: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    labelKey: "sidebar.group.audit",
    items: [
      {
        href: "/admin/payment-audits",
        textKey: "sidebar.paymentHistory",
        icon: CreditCard,
        requiredGroupKeys: ["AUDIT"],
      },
      {
        href: "/admin/balance-history",
        textKey: "sidebar.balanceHistory",
        icon: WalletCards,
        requiredGroupKeys: ["AUDIT"],
      },
      {
        href: "/admin/bank-history",
        textKey: "sidebar.bankHistory",
        icon: Landmark,
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
        href: "/admin/security-audits",
        textKey: "sidebar.securityHistory",
        icon: FolderLock,
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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "sidebar.courses": false,
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
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col overflow-visible border-r transition-all duration-300",
        collapsed ? "w-24" : "w-[280px]",
        dark
          ? "border-white/10 bg-[linear-gradient(180deg,#071224_0%,#0a1730_100%)]"
          : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center border-b px-4",
          collapsed ? "h-[72px]" : "h-[96px]",
          dark ? "border-white/10" : "border-slate-200"
        )}
      >
        <div
          title={currentUser?.name || t("common.admin")}
          className={cn(
            "relative flex items-center justify-center overflow-hidden transition-all duration-300",
            collapsed ? "h-[60px] w-[60px]" : "h-[78px] w-[248px]"
          )}
        >
          <Image
            src={collapsed ? "/Logo-icon.png" : "/Logo-horizontal-clean.png"}
            alt="Everest"
            width={collapsed ? 572 : 919}
            height={collapsed ? 435 : 241}
            priority
            className={cn(
              "shrink-0 object-contain",
              collapsed ? "h-14 w-14" : "h-[70px] w-[248px]"
            )}
          />
        </div>
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
                      isActiveHref(pathname, child.href)
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
                              const selected = isActiveHref(
                                pathname,
                                child.href
                              );

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
                    ? isActiveHref(pathname, item.href)
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
