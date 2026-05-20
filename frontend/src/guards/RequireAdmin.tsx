"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { canAccessAdmin } from "@/lib/helpers/auth/access";

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, access, hydrated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated || isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const allowed = canAccessAdmin(access);

    if (!allowed) {
      router.replace("/403");
    }
  }, [hydrated, isLoading, user, access, router, pathname]);

  if (!hydrated || isLoading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  if (!user) return null;

  const allowed = canAccessAdmin(access);

  if (!allowed) return null;

  return <>{children}</>;
}
