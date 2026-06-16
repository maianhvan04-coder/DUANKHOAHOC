"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { blogApi, type BlogItem } from "@/app/api/blog.api";

const ALL_CATEGORY = "Tất cả";
const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 6;

const FALLBACK_IMAGES = [
  "/Knowledge/PostGrid/post-grid-1.jpg",
  "/Knowledge/PostGrid/post-grid-2.jpg",
  "/Knowledge/PostGrid/post-grid-3.jpg",
  "/Knowledge/PostGrid/post-grid-4.jpg",
  "/Knowledge/PostGrid/post-grid-5.jpg",
  "/Knowledge/PostGrid/post-grid-6.jpg",
];

const badgeColors = [
  "bg-[#20c9c9]",
  "bg-[#1f4f8c]",
  "bg-[#14b8a6]",
  "bg-[#6b7280]",
];

function formatDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isAllowedImage(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getPostImage(post: BlogItem, index: number) {
  if (isAllowedImage(post.image)) return post.image || "";
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function getPostHref(post: BlogItem) {
  return `/goc-kien-thuc/${encodeURIComponent(post.slug || post._id)}`;
}

function PostGridSkeleton() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] animate-pulse rounded-[18px] bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function KnowledgePostGrid() {
  const [posts, setPosts] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        setLoading(true);
        const res = await blogApi.getAll({
          limit: 100,
          sortBy: "publishedAt",
          sortOrder: "desc",
        });

        if (mounted) setPosts(res.items || []);
      } catch (error) {
        console.error("Load knowledge posts failed:", error);
        if (mounted) setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(posts.map((post) => post.category).filter(Boolean))
    );

    return [ALL_CATEGORY, ...uniqueCategories];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_STEP);
  };

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <div className="no-scrollbar flex flex-wrap gap-3">
          {categories.map((item) => {
            const isActive = selectedCategory === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => handleSelectCategory(item)}
                className={[
                  "shrink-0 rounded-full px-5 py-3 text-base font-medium transition-all",
                  isActive
                    ? "bg-[#0b4b84] text-white shadow-[0_6px_16px_rgba(11,75,132,0.24)]"
                    : "bg-[#f2f4f7] text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>

        {loading ? (
          <PostGridSkeleton />
        ) : visiblePosts.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post, index) => (
              <Link
                key={post._id}
                href={getPostHref(post)}
                className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
              >
                <div className="relative aspect-[1.45/1] w-full bg-slate-100">
                  <Image
                    src={getPostImage(post, index)}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${
                      badgeColors[index % badgeColors.length]
                    }`}
                  >
                    {post.category}
                  </span>

                  <h3 className="mt-3 line-clamp-2 text-[22px] font-bold leading-tight text-slate-900 md:text-[24px]">
                    {post.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-[15px] leading-6 text-slate-600">
                    {post.excerpt || post.content}
                  </p>

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[18px] border border-dashed border-slate-300 px-6 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Chưa có bài viết trong chuyên mục này.
            </p>
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-lg bg-[#0b4b84] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08365f]"
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
