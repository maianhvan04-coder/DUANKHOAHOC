"use client";

import { Bell, Moon, Sun } from "lucide-react";
import AvatarMenu from "@/components/layouts/admin/topbar/AvatarMenu";
import { useAdminTheme } from "@/providers/admin/AdminDarkmodeProvider";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AdminTopbar() {
  const { theme, toggleTheme } = useAdminTheme();
  const dark = theme === "dark";

  return (
    <header
      className={cn(
        "mb-6 rounded-[26px] border px-4 py-4 shadow-sm md:px-5",
        dark
          ? "border-white/10 bg-[#111827] shadow-black/20"
          : "border-black/8 bg-white shadow-black/5"
      )}
    >
      <div className="flex w-full items-center justify-end gap-3">
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

          <button
            type="button"
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
          </button>
        </div>

        <AvatarMenu />
      </div>
    </header>
  );
}