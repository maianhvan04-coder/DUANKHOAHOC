import type { Metadata } from "next";

import CourseDetailPageClient from "./CourseDetailPageClient";

export const metadata: Metadata = {
  title: "Chi tiết khóa học - Everest",
  description: "Xem thông tin khóa học và đăng ký học tại Everest.",
};

type CourseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;

  return <CourseDetailPageClient courseId={decodeURIComponent(id)} />;
}
