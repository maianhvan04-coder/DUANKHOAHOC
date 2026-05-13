import type { ReactNode } from "react";
import { StudentPreferencesProvider } from "@/i18n";
import StudentGuard from "@/guards/StudentGuard";
import StudentShell from "@/components/layouts/student/StudentShell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <StudentPreferencesProvider>
      <StudentGuard>
        <StudentShell>{children}</StudentShell>
      </StudentGuard>
    </StudentPreferencesProvider>
  );
}
