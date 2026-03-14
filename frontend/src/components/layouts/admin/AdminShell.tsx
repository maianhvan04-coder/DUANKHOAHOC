"use client";

import type { ReactNode } from "react";
import AdminSidebar from "@/components/layouts/admin/sidebar/AdminSidebar";
import AdminTopbar from "@/components/layouts/admin/topbar/AdminTopbar";
import { AdminThemeProvider, useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";
import {
  AdminLayoutProvider,
} from "@/components/layouts/admin/admin-layout-context";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AdminShellFrame({ children }: { children: ReactNode }) {
  const { theme } = useAdminTheme();
  const dark = theme === "dark";

  return (
    <div
      className={cn(
        "min-h-screen w-full transition-colors duration-300",
        dark ? "bg-[#0b1220]" : "bg-[#f4f7fb]"
      )}
    >
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="min-w-0 flex-1 p-5 md:p-7 xl:p-8">
          <AdminTopbar />
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutProvider>
        <AdminShellFrame>{children}</AdminShellFrame>
      </AdminLayoutProvider>
    </AdminThemeProvider>
  );
}