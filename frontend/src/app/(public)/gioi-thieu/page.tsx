import BrandStorySection from "@/components/ui/client/Introduce/BrandStory/BrandStorySection";
import AboutHeroSection from "@/components/ui/client/Introduce/Hero/AboutHeroSection";
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
            <BrandStorySection />
        </main>
    );
}