"use client";

import Image from "next/image";
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  ScrollText,
} from "lucide-react";

export type TeacherItem = {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  achievement: string;
  certificateTitle: string;
  certificateDetail: string;
  educationTitle: string;
  educationDetail: string;
  experienceTitle: string;
  experienceDetail: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function InfoRow({
  icon,
  title,
  detail,
  italic = false,
  titleClassName,
  detailClassName,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  italic?: boolean;
  titleClassName?: string;
  detailClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-[#163B6D]">{icon}</div>

      <div>
        <div
          className={cn(
            "text-[16px] font-extrabold leading-[1.2] text-[#163B6D]",
            titleClassName
          )}
        >
          {title}
        </div>

        <p
          className={cn(
            "mt-2 text-[14px] leading-tight text-[#5B606A]",
            italic && "italic",
            detailClassName
          )}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}

export default function TeacherCard({
  item,
}: {
  item: TeacherItem;
}) {
  return (
    <article>
      <div className="relative h-57.5 md:h-62.5">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          className="rounded-[22px] object-cover object-center"
        />
      </div>

      <div className="mt-5">
        <h3 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#032654] md:text-[24px]">
          {item.name}
        </h3>

        <p className="mt-4 text-[16px] font-bold leading-[1.3] text-[#163B6D]">
          {item.role}
        </p>

        <div className="mt-5 space-y-4">
          <InfoRow
            icon={<ScrollText className="h-5 w-5" strokeWidth={1.8} />}
            title="Thành tích"
            detail={item.achievement}
            italic
          />

          <InfoRow
            icon={<Award className="h-5 w-5" strokeWidth={1.8} />}
            title={item.certificateTitle}
            detail={item.certificateDetail}
            italic
            titleClassName="text-[16px]"
            detailClassName="text-[14px] leading-tight"
          />

          <InfoRow
            icon={<GraduationCap className="h-5 w-5" strokeWidth={1.8} />}
            title={item.educationTitle}
            detail={item.educationDetail}
          />

          <InfoRow
            icon={<BriefcaseBusiness className="h-5 w-5" strokeWidth={1.8} />}
            title={item.experienceTitle}
            detail={item.experienceDetail}
          />
        </div>
      </div>
    </article>
  );
}