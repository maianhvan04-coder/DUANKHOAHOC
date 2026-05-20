"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { getAdminEntryPath } from "@/lib/helpers/auth/access";

export default function AdminPage() {
  const router = useRouter();
  const { access, hydrated, isLoading } = useAuth();

  useEffect(() => {
    if (!hydrated || isLoading) return;
    router.replace(getAdminEntryPath(access) ?? "/403");
  }, [access, hydrated, isLoading, router]);

  return null;
}
