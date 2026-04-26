import AboutOverviewSection from "@/components/ui/client/Introduce/AboutOverview/AboutOverviewSection";
import BrandStorySection from "@/components/ui/client/Introduce/BrandStory/BrandStorySection";
import FeaturedActivitiesSection from "@/components/ui/client/Introduce/FeaturedActivitie/FeaturedActivitiesSection";
import AboutHeroSection from "@/components/ui/client/Introduce/Hero/AboutHeroSection";
import MissionValuesSection from "@/components/ui/client/Introduce/MissionValues/MissionValuesSection";
import TestimonialsSection from "@/components/ui/client/Introduce/Testimonials/TestimonialsSection";
import TrainingMethodSection from "@/components/ui/client/Introduce/TrainingMethod/TrainingMethodSection";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Giới thiệu",
    description:
        "Khám phá Everest - nơi khởi nguồn tri thức, kiến tạo tương lai với môi trường học tập hiện đại và đội ngũ giảng viên tận tâm.",
};

export default function Page() {
    return (
        <main>
            <AboutHeroSection />
            <MissionValuesSection />
            <BrandStorySection />
            <TrainingMethodSection />
            <AboutOverviewSection />
            <FeaturedActivitiesSection />
            <TestimonialsSection />
        </main>
    );
}