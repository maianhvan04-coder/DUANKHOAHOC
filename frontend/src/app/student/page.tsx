"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { getStudentEntryPath } from "@/lib/helpers/auth/access";

export default function StudentIndexPage() {
  const router = useRouter();
  const { user, access, hydrated, isLoading } = useAuth();

  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (!user) {
      router.replace("/login?redirect=%2Fstudent");
      return;
    }

    router.replace(getStudentEntryPath(access) ?? "/");
  }, [access, hydrated, isLoading, router, user]);

  return null;
}
