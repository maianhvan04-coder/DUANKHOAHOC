"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, hydrated, isLoading } = useAuth(); // ✅ thêm isLoading
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ✅ chờ AuthProvider bootstrap xong
    if (!hydrated || isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/403");
    }
  }, [hydrated, isLoading, user, router, pathname]);

  // ✅ show loading để khỏi redirect sớm
  if (!hydrated || isLoading) return <div style={{ padding: 16 }}>Loading...</div>;

  // ✅ đang redirect
  if (!user || user.role !== "ADMIN") return null;

  return <>{children}</>;
}
