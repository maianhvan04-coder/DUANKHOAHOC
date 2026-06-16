import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "../../EmptyState";
import type { User } from "../../../types/auth.type";
import type { BlogItem } from "../../../types/blog.type";
import type { StudentStudyItem } from "../../../types/student-study.type";

type StudentFeedTabProps = {
  user: User;
  studies: StudentStudyItem[];
  unreadCount: number;
  blogs: BlogItem[];
  blogErrorText: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "1 giờ";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "1 giờ";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getBlogSummary(blog: BlogItem) {
  return stripHtml(blog.excerpt || blog.content || "Bài viết từ Everest.");
}

function getSourceName(blog: BlogItem) {
  return blog.authorName || blog.category || "Everest";
}

export default function StudentFeedTab({
  blogs,
  blogErrorText,
}: StudentFeedTabProps) {
  const featuredBlog = blogs[0];
  const sideBlogs = blogs.slice(1);

  return (
    <View className="pb-6">
      {blogErrorText ? (
        <View className="mb-3 flex-row items-center gap-2 rounded-2xl bg-red-50 px-4 py-3">
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
          <Text className="flex-1 text-sm font-semibold text-red-600">
            {blogErrorText}
          </Text>
        </View>
      ) : null}

      {blogs.length === 0 ? (
        <View className="rounded-3xl bg-white">
          <EmptyState message="Chưa có bài viết mới để hiển thị." />
        </View>
      ) : (
        <View>
          {featuredBlog ? <FeaturedNewsCard blog={featuredBlog} /> : null}

          <View className="mt-4 flex-row flex-wrap justify-between">
            {sideBlogs.map((blog) => (
              <SmallNewsCard key={blog._id || blog.slug} blog={blog} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function BlogImage({
  blog,
  height,
  rounded = true,
}: {
  blog: BlogItem;
  height: number;
  rounded?: boolean;
}) {
  if (!blog.image) {
    return (
      <View
        className={`items-center justify-center bg-slate-100 ${
          rounded ? "rounded-xl" : ""
        }`}
        style={{ width: "100%", height }}
      >
        <Ionicons name="newspaper-outline" size={34} color="#64748B" />
      </View>
    );
  }

  return (
    <Image
      source={blog.image}
      style={{
        width: "100%",
        height,
        backgroundColor: "#E2E8F0",
        borderRadius: rounded ? 12 : 0,
      }}
      contentFit="cover"
      transition={180}
      cachePolicy="memory-disk"
      accessibilityLabel={blog.title}
    />
  );
}

function SourceRow({ blog }: { blog: BlogItem }) {
  return (
    <View className="mt-2 flex-row items-center">
      <View className="mr-1.5 h-4 w-4 items-center justify-center rounded-full bg-red-600">
        <Text className="text-[9px] font-black text-white">●</Text>
      </View>

      <Text className="text-[11px] font-semibold text-slate-500">
        {getSourceName(blog)}
      </Text>

      <Text className="mx-1 text-[11px] text-slate-400">-</Text>

      <Text className="text-[11px] font-semibold text-slate-400">
        {formatDate(blog.publishedAt || blog.createdAt)}
      </Text>
    </View>
  );
}

function FeaturedNewsCard({ blog }: { blog: BlogItem }) {
  return (
    <View className="bg-white">
      <BlogImage blog={blog} height={210} rounded={false} />

      <View className="pt-2">
        <Text
          className="text-[17px] font-extrabold leading-6 text-slate-950"
          numberOfLines={3}
        >
          {blog.title}
        </Text>

        <Text
          className="mt-1 text-[13px] leading-5 text-slate-500"
          numberOfLines={2}
        >
          {getBlogSummary(blog)}
        </Text>

        <SourceRow blog={blog} />
      </View>
    </View>
  );
}

function SmallNewsCard({ blog }: { blog: BlogItem }) {
  return (
    <View className="mb-4" style={{ width: "48.5%" }}>
      <BlogImage blog={blog} height={108} />

      <Text
        className="mt-2 text-[13px] font-extrabold leading-5 text-slate-950"
        numberOfLines={3}
      >
        {blog.title}
      </Text>

      <SourceRow blog={blog} />
    </View>
  );
}