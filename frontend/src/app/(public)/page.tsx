import CommunitySection from "@/components/ui/client/Home/Community/CommunitySection";
import ExamSystemsSection from "@/components/ui/client/Home/ExamSystem/ExamSystemsSection";
import HeroBanner from "@/components/ui/client/Home/Hero/hero";
import IigELearningSection from "@/components/ui/client/Home/IigELearning/IigELearningSection";
import StudentAchievementsSection from "@/components/ui/client/Home/StudentAchievement/StudentAchievementsSection";
import StudyProgramsSection from "@/components/ui/client/Home/StudyProgram/StudyProgramsSection";
import TeachersSection from "@/components/ui/client/Home/Teacher/TeachersSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khóa Học Online - Lập Trình Đa Ngôn Ngữ",
  description:
    "Đạt 6.5+ IELTS sau 1 khoá học với Adaptive Learning.",
};

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <HeroBanner />
      <IigELearningSection />
      <StudyProgramsSection />
      <CommunitySection />
      <TeachersSection />
      <StudentAchievementsSection />
      <ExamSystemsSection />
    </main>
  );
}