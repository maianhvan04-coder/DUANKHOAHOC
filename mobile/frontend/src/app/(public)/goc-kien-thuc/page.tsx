import type { Metadata } from "next";
import KnowledgeHeroSection from "@/components/ui/client/Knowledge/Hero/KnowledgeHeroSection";
import KnowledgeFeaturedSection from "@/components/ui/client/Knowledge/Featured/KnowledgeFeaturedSection";
import KnowledgePostGridSection from "@/components/ui/client/Knowledge/PostGrid/KnowledgePostGridSection";
import KnowledgeNewsletterSection from "@/components/ui/client/Knowledge/Newsletter/KnowledgeNewsletterSection";




export const metadata: Metadata = {
  title: "Góc kiến thức",
  description:
    "Chia sẻ kinh nghiệm học tập, phương pháp hiệu quả và định hướng giáo dục cho tương lai của bạn.",
};

export default function Page() {
  return (
    <main>
        <KnowledgeHeroSection />
        <KnowledgeFeaturedSection />
        <KnowledgePostGridSection />
        <KnowledgeNewsletterSection />
    </main>
  );
}