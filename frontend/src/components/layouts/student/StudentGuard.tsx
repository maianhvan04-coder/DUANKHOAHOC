"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useStudentPreferences } from "@/i18n";
import { canAccessStudentPortal } from "@/lib/helpers/auth/access";

const STUDENT_LOADING_ANIMATION =
  "https://lottie.host/4e4a8629-998c-4d2c-8fb0-8c02bedae129/zYMkSCnLJ1.lottie";
const STUDENT_LOADING_DELAY_MS = 5000;
const STUDENT_PAGE_PRELOAD_MS = 4200;

function StudentLoadingVisual({ text }: { text: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center">
      <DotLottieReact
        src={STUDENT_LOADING_ANIMATION}
        loop
        autoplay
        className="h-52 w-52 sm:h-64 sm:w-64"
      />

      <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {text}
      </p>
    </div>
  );
}

function StudentLoadingOverlay({
  show,
  text,
}: {
  show: boolean;
  text: string;
}) {
  return (
    <div
      aria-hidden={!show}
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center bg-[#F4F7FB] px-4 py-16 transition-opacity duration-1000 ease-out md:px-6 dark:bg-slate-950",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <StudentLoadingVisual text={text} />
    </div>
  );
}

function StudentLoadingFrame({
  children,
  contentMounted,
  loadingDone,
  text,
}: {
  children?: ReactNode;
  contentMounted: boolean;
  loadingDone: boolean;
  text: string;
}) {
  return (
    <main className="min-h-screen bg-[#F4F7FB] dark:bg-slate-950">
      <div
        className={[
          "transition-opacity duration-1000 ease-out",
          loadingDone ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {contentMounted ? children : null}
      </div>
      <StudentLoadingOverlay show={!loadingDone} text={text} />
    </main>
  );
}

function ForbiddenStudentRoute() {
  const { t } = useStudentPreferences();

  return (
    <main className="min-h-[520px] bg-slate-50 px-4 py-16 md:px-6 dark:bg-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-500/25 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
          {t("guard.forbiddenTitle")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t("guard.forbiddenDescription")}
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#0D56A6] px-5 text-sm font-semibold text-white transition hover:bg-[#0B4A8E]"
        >
          {t("guard.home")}
        </Link>
      </section>
    </main>
  );
}

export default function StudentGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, access, hydrated, isLoading } = useAuth();
  const { t } = useStudentPreferences();
  const [contentMounted, setContentMounted] = useState(false);
  const [loadingDelayDone, setLoadingDelayDone] = useState(false);

  const ready = hydrated && !isLoading;
  const canAccessStudent = canAccessStudentPortal(access);
  const shouldDelayStudentEntry = ready && Boolean(user) && canAccessStudent;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/student/bang-tin";

      router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [ready, router, user]);

  useEffect(() => {
    if (!shouldDelayStudentEntry) return;

    const preloadTimer = window.setTimeout(() => {
      setContentMounted(true);
    }, STUDENT_PAGE_PRELOAD_MS);

    const revealTimer = window.setTimeout(() => {
      setLoadingDelayDone(true);
    }, STUDENT_LOADING_DELAY_MS);

    return () => {
      window.clearTimeout(preloadTimer);
      window.clearTimeout(revealTimer);
    };
  }, [shouldDelayStudentEntry]);

  if (!ready) {
    return (
      <StudentLoadingFrame
        contentMounted={false}
        loadingDone={false}
        text={t("guard.checking")}
      />
    );
  }

  if (!user) {
    return (
      <StudentLoadingFrame
        contentMounted={false}
        loadingDone={false}
        text={t("guard.redirecting")}
      />
    );
  }

  if (!canAccessStudent) {
    return <ForbiddenStudentRoute />;
  }

  return (
    <StudentLoadingFrame
      contentMounted={contentMounted}
      loadingDone={loadingDelayDone}
      text={t("guard.checking")}
    >
      {children}
    </StudentLoadingFrame>
  );
}
