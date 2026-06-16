"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import CommunityImage from "./CommunityGallery";

type CommunityTabKey = "languages" | "technology";

type CommunityContent = {
  items: string[];
  buttonText: string;
  buttonHref: string;
  image: string;
  imageAlt: string;
};

const COMMUNITY_DATA: Record<CommunityTabKey, CommunityContent> = {
  languages: {
    items: [
      "Kết nối học viên đang theo học Tiếng Anh và Tiếng Trung tại Everest để cùng chia sẻ kinh nghiệm, tài liệu và phương pháp học hiệu quả.",
      "Cập nhật nội dung học tập, bài luyện thực hành và định hướng ôn tập phù hợp với từng giai đoạn của lộ trình.",
      "Trao đổi cùng giảng viên và cộng đồng về cách cải thiện từ vựng, giao tiếp, phát âm và khả năng ứng dụng ngôn ngữ trong thực tế.",
      "Tạo động lực học tập đều đặn thông qua môi trường học tích cực, có tương tác và đồng hành xuyên suốt.",
      "Mở rộng cơ hội giao lưu, thực hành và phát triển sự tự tin trong quá trình học ngoại ngữ tại Everest.",
    ],
    buttonText: "Tham gia cộng đồng",
    buttonHref: "/",
    image: "/home/community/community-toeic.png",
    imageAlt: "Ngoại ngữ tại Everest",
  },
  technology: {
    items: [
      "Kết nối học viên đang theo học Toán học và Lập trình tại Everest để cùng rèn tư duy, kỹ năng và khả năng giải quyết vấn đề.",
      "Cập nhật bài học trọng tâm, tài liệu thực hành và nội dung bổ trợ phù hợp với từng cấp độ học tập.",
      "Trao đổi kinh nghiệm học tập, cách tiếp cận bài toán, tư duy logic và ứng dụng công nghệ trong thực tế.",
      "Nhận hỗ trợ từ giảng viên và cộng đồng trong quá trình học, thực hành và hoàn thiện kỹ năng từng bước.",
      "Xây dựng môi trường học tập chủ động, hiện đại và có định hướng rõ ràng cho người học tại Everest.",
    ],
    buttonText: "Khám phá lộ trình",
    buttonHref: "/",
    image: "/home/community/community-toefl.png",
    imageAlt: "Toán học và Lập trình tại Everest",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CommunitySection() {
  const [activeTab, setActiveTab] = useState<CommunityTabKey>("languages");

  const current = useMemo(() => COMMUNITY_DATA[activeTab], [activeTab]);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Cộng đồng học viên tại Everest</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("languages")}
                className={cn(
                  "inline-flex h-15.5 min-w-57.5 items-center justify-center rounded-xl border px-7 text-[16px] font-bold transition",
                  activeTab === "languages"
                    ? "border-[#0D56A6] bg-[#EAF1F8] text-[#0D56A6]"
                    : "border-[#D9DDE3] bg-white text-[#032654] hover:border-[#0D56A6]/40"
                )}
              >
                Ngoại ngữ tại Everest
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("technology")}
                className={cn(
                  "inline-flex h-15.5 min-w-57.5 items-center justify-center rounded-xl border px-7 text-[16px] font-bold transition",
                  activeTab === "technology"
                    ? "border-[#0D56A6] bg-[#EAF1F8] text-[#0D56A6]"
                    : "border-[#D9DDE3] bg-white text-[#032654] hover:border-[#0D56A6]/40"
                )}
              >
                Toán học & Lập trình tại Everest
              </button>
            </div>

            <div className="mt-10">
              <div className="space-y-6">
                {current.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#032654]" />
                    <p className="text-[18px] font-semibold leading-[1.3] text-[#032654] md:text-[20px]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={current.buttonHref}
                className="mt-10 inline-flex h-12 items-center justify-center rounded-lg bg-[#0D56A6] px-7 text-[14px] font-bold text-white transition hover:bg-[#0A478A]"
              >
                {current.buttonText}
              </Link>
            </div>
          </div>

          <CommunityImage src={current.image} alt={current.imageAlt} />
        </div>
      </div>
    </section>
  );
}