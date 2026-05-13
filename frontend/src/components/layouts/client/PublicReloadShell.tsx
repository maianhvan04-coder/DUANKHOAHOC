"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/auth/useAuth";
import Footer from "@/components/layouts/client/footer/Footer";
import Navbar from "@/components/layouts/client/navbar/Navbar";

const USER_RELOAD_MIN_MS = 3200;

function PublicReloadScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f7f7f7] px-6 text-center">
      <div className="flex w-full max-w-[560px] flex-col items-center">
        <Image
          src="/Logo.png"
          alt="Everest"
          width={420}
          height={220}
          priority
          className="h-auto w-[290px] object-contain sm:w-[360px]"
        />

        <div className="mt-8 h-5 w-full max-w-[530px] overflow-hidden rounded-full border-[5px] border-[#08295a] bg-[#08295a]">
          <div className="h-full rounded-full bg-[#a9d9f4] public-reload-progress" />
        </div>

        <p className="mt-4 text-xl font-light tracking-wide text-slate-800 sm:text-2xl">
          Innovating your learning experience...
        </p>
      </div>
    </div>
  );
}

export default function PublicReloadShell({
  children,
}: {
  children: ReactNode;
}) {
  const { hydrated, isLoading } = useAuth();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinDelayDone(true);
    }, USER_RELOAD_MIN_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const showLoading = !hydrated || isLoading || !minDelayDone;

  if (showLoading) {
    return <PublicReloadScreen />;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
