import { Cog, GraduationCap, Headphones, type LucideIcon } from "lucide-react";

export type WhyChooseFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export const whyChooseFeatures: WhyChooseFeature[] = [
  {
    icon: Cog,
    title: "Lộ trình cá nhân hóa",
    desc: "Xây dựng lộ trình học phù hợp với năng lực, mục tiêu và tốc độ tiếp thu của từng học viên.",
  },
  {
    icon: GraduationCap,
    title: "Giảng viên chuyên gia",
    desc: "Đội ngũ giảng viên nhiều kinh nghiệm, chuyên môn cao và luôn đồng hành trong suốt quá trình học.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    desc: "Luôn sẵn sàng giải đáp thắc mắc, hỗ trợ học viên nhanh chóng để việc học không bị gián đoạn.",
  },
];