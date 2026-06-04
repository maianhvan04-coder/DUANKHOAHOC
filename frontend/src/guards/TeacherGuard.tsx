"use client";

import { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { canAccessTeacherPortal } from "@/lib/helpers/auth/access";

function ForbiddenTeacherRoute() {
  return (
    <main className="min-h-[520px] bg-slate-50 px-4 py-16 md:px-6 dark:bg-slate-950">
      <section className="mx-auto max-w-3xl rounded-lg border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-500/25 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          Bạn không có quyền truy cập khu vực giáo viên
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Vui lòng đăng nhập bằng tài khoản giáo viên hoặc liên hệ quản trị viên.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#0D56A6] px-5 text-sm font-semibold text-white transition hover:bg-[#0B4A8E]"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}

export default function TeacherGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, access, hydrated, isLoading } = useAuth();

  const ready = hydrated && !isLoading;
  const canAccessTeacher = canAccessTeacherPortal(access);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/teacher/bang-tin";

      router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [ready, router, user]);

  if (!ready || !user) {
    return null;
  }

  if (!canAccessTeacher) {
    return <ForbiddenTeacherRoute />;
  }

  return <>{children}</>;
}
