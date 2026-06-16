
import type { Metadata } from "next";
import ProgramHeroSection from "@/components/ui/client/Program/Hero/ProgramHeroSection";
import ProgramCatalogSection from "@/components/ui/client/Program/Catalog/ProgramCatalogSection";
import ProgramRoadmapSection from "@/components/ui/client/Program/Roadmap/ProgramRoadmapSection";
import FeaturedCoursesSection from "@/components/ui/client/Program/FeaturedCourses/FeaturedCoursesSection";

export const metadata: Metadata = {
  title: "Chương Trình Học | Khóa Học Online",
  description:
    "Khám phá lộ trình học bài bản, phương pháp đào tạo hiện đại và hệ thống chương trình học toàn diện cho mọi trình độ.",
};

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <ProgramHeroSection />
      <ProgramCatalogSection />
      <ProgramRoadmapSection />
      <FeaturedCoursesSection/>
    </main>
  );
}