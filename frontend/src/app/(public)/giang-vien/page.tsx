import TeachersSection from "@/components/ui/client/Teacher/TeachersHeroSection";
import TeachersIntroSection from "@/components/ui/client/Teacher/TeachersIntroSection";
import EducationalmethodsSection from "@/components/ui/client/Teacher/EducationalmethodsSection";
import RelatedPostsSection from "@/components/ui/client/Teacher/RelatedPostsSection";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <TeachersSection />
      <EducationalmethodsSection />
      <TeachersIntroSection />
      <RelatedPostsSection />
    </main>
  );
}