import TeachersSection from "@/components/ui/client/Teacher/TeachersHeroSection";
import TeachersIntroSection from "@/components/ui/client/Teacher/TeachersIntroSection";
import RelatedPostsSection from "@/components/ui/client/Teacher/RelatedPostsSection";

export default function Page() {
  return (
    <div className="relative overflow-hidden bg-white">
      <TeachersSection />
      <TeachersIntroSection />
      <RelatedPostsSection />
    </div>
  );
}
