import type { ReactNode } from "react";
import TeacherGuard from "@/guards/TeacherGuard";
import TeacherShell from "@/components/layouts/teacher/TeacherShell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <TeacherGuard>
      <TeacherShell>{children}</TeacherShell>
    </TeacherGuard>
  );
}
