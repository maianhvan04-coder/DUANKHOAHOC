"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { clearToken, clearUser } from "@/lib/utils/storage";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAdminPreferences } from "@/i18n";

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return avatar;
}

export default function AvatarMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useAdminPreferences();

  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      clearToken();
      clearUser();
      setOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const safeName =
    typeof user?.name === "string" ? user.name.trim() : "";
  const safeEmail =
    typeof user?.email === "string" ? user.email.trim() : "";

  const userInitial =
    safeName.charAt(0).toUpperCase() ||
    safeEmail.charAt(0).toUpperCase() ||
    "U";

  const userAvatar = resolveAvatarUrl(user?.avatar);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center bg-transparent p-0 transition hover:opacity-85"
        aria-label={t("common.account")}
        aria-expanded={open}
        title={safeName || safeEmail || t("common.account")}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={safeName || "Avatar"}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : safeName || safeEmail ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1677ff] text-sm font-bold text-white">
            {userInitial}
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <User className="h-5 w-5" />
          </div>
        )}

      </button>

      <div
        className={`absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={safeName || "Avatar"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1677ff] text-base font-bold text-white">
                {userInitial}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {safeName || t("common.user")}
              </p>
              <p className="truncate text-xs text-slate-500">
                {safeEmail || t("common.noEmail")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t("common.backToClient")}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span>
              {loggingOut ? t("common.loggingOut") : t("common.logout")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
