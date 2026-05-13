"use client";

import { type ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Lightbulb, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useStudentPreferences } from "@/i18n";
import { canAccessStudentPortal } from "@/lib/helpers/auth/access";

const STUDENT_LOADING_DELAY_MS = 5000;
const STUDENT_PAGE_PRELOAD_PERCENT = 84;

function StudentLoadingVisual({ progress }: { progress: number }) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const orbitItems = Array.from({ length: 12 }, (_, index) => index);

  return (
    <div className="relative flex w-full max-w-[620px] flex-col items-center text-center text-[#09285a]">
      <Image
        src="/Logo-horizontal-clean.png"
        alt="Everest"
        width={919}
        height={241}
        priority
        className="h-auto w-[300px] object-contain sm:w-[360px]"
      />

      <div className="relative mt-6 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
        <div
          className="absolute h-34 w-34 rounded-full sm:h-40 sm:w-40"
          style={{
            background: `conic-gradient(#79b9de ${clampedProgress * 3.6}deg, rgba(255,255,255,0.78) 0deg)`,
            boxShadow: "0 0 0 18px rgba(255,255,255,0.45)",
          }}
        />
        <div className="absolute h-24 w-24 rounded-full bg-[#eef9ff] shadow-[inset_0_0_0_1px_rgba(8,41,90,0.08)] sm:h-28 sm:w-28" />
        <div className="relative z-10 text-3xl font-extrabold sm:text-4xl">
          {clampedProgress}%
        </div>

        <div className="absolute inset-0 animate-[student-loading-spin_12s_linear_infinite]">
          {orbitItems.map((item) => {
            const angle = (item / orbitItems.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 104;
            const Icon = item % 2 === 0 ? BookOpen : Lightbulb;

            return (
              <div
                key={item}
                className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[#08295a] sm:h-10 sm:w-10"
                style={{
                  marginLeft: `${Math.cos(angle) * radius}px`,
                  marginTop: `${Math.sin(angle) * radius}px`,
                }}
              >
                <Icon
                  className="h-8 w-8 stroke-[2.6] sm:h-9 sm:w-9 student-loading-icon"
                  style={{ animationDelay: `${item * 120}ms` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex w-full max-w-[490px] items-center gap-4 rounded-full border-2 border-[#08295a] bg-white px-6 py-4 text-left shadow-[0_8px_24px_rgba(8,41,90,0.18)]">
        <Lightbulb className="h-9 w-9 shrink-0 stroke-[2.4] text-[#08295a]" />
        <p className="text-sm leading-6 text-slate-800 sm:text-base">
          <span className="font-bold">Tip:</span> Break down complex topics into
          smaller chunks and teach them to a friend to solidify your
          understanding.
        </p>
      </div>
    </div>
  );
}

function StudentLoadingOverlay({
  progress,
  show,
}: {
  progress: number;
  show: boolean;
}) {
  return (
    <div
      aria-hidden={!show}
      className={[
        "student-learning-loading fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#bde8ff] px-4 py-12 transition-opacity duration-1000 ease-out md:px-6",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <StudentLoadingVisual progress={progress} />
    </div>
  );
}

function StudentLoadingFrame({
  children,
  contentMounted,
  loadingDone,
  progress,
}: {
  children?: ReactNode;
  contentMounted: boolean;
  loadingDone: boolean;
  progress: number;
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
      <StudentLoadingOverlay show={!loadingDone} progress={progress} />
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
  const [contentMounted, setContentMounted] = useState(false);
  const [loadingDelayDone, setLoadingDelayDone] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

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

    let frame = 0;
    const startedAt = window.performance.now();

    function tick(now: number) {
      const nextProgress = Math.min(
        100,
        ((now - startedAt) / STUDENT_LOADING_DELAY_MS) * 100
      );

      setLoadingProgress(nextProgress);

      if (nextProgress >= STUDENT_PAGE_PRELOAD_PERCENT) {
        setContentMounted(true);
      }

      if (nextProgress >= 100) {
        setLoadingDelayDone(true);
        return;
      }

      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [shouldDelayStudentEntry]);

  if (!ready) {
    return (
      <StudentLoadingFrame
        contentMounted={false}
        loadingDone={false}
        progress={0}
      />
    );
  }

  if (!user) {
    return (
      <StudentLoadingFrame
        contentMounted={false}
        loadingDone={false}
        progress={0}
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
      progress={loadingProgress}
    >
      {children}
    </StudentLoadingFrame>
  );
}
