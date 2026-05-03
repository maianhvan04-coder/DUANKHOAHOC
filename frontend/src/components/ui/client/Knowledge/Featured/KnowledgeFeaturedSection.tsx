"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { blogApi, type BlogItem } from "@/app/api/blog.api";

const FALLBACK_IMAGES = [
  "/Knowledge/Featured/knowledge-1.png",
  "/Knowledge/Featured/knowledge-2.jpg",
  "/Knowledge/Featured/knowledge-3.jpg",
  "/Knowledge/Featured/knowledge-4.jpg",
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

function FeaturedSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <div className="h-[430px] animate-pulse rounded-[18px] bg-slate-100" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[122px] animate-pulse rounded-[16px] bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

export default function KnowledgeFeaturedSection() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        setLoading(true);
        const res = await blogApi.getAll({
          limit: 5,
          sortBy: "publishedAt",
          sortOrder: "desc",
        });

        if (mounted) setItems(res.items || []);
      } catch (error) {
        console.error("Load featured knowledge posts failed:", error);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const mainPost = items[0];
  const sidePosts = useMemo(() => items.slice(1, 5), [items]);

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        {loading ? (
          <FeaturedSkeleton />
        ) : mainPost ? (
          <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <Link
              href={getPostHref(mainPost)}
              className="block overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
            >
              <div className="relative aspect-[16/8.3] w-full bg-slate-100">
                <Image
                  src={getPostImage(mainPost, 0)}
                  alt={mainPost.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="p-4 md:p-5">
                <span className="inline-flex rounded-full bg-[#0b4b84] px-3 py-1 text-xs font-semibold text-white">
                  {mainPost.category}
                </span>

                <h3 className="mt-3 text-[24px] font-bold leading-tight text-slate-900 md:text-[30px]">
                  {mainPost.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-slate-600">
                  {mainPost.excerpt || mainPost.content}
                </p>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  {formatDate(mainPost.publishedAt || mainPost.createdAt)}
                </p>
              </div>
            </Link>

            <div className="space-y-4">
              {sidePosts.map((post, index) => (
                <Link
                  key={post._id}
                  href={getPostHref(post)}
                  className="flex gap-3 rounded-[16px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)]"
                >
                  <div className="relative h-[96px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                    <Image
                      src={getPostImage(post, index + 1)}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="inline-flex w-fit rounded-full bg-[#1ba6a6] px-3 py-1 text-[11px] font-semibold text-white">
                      {post.category}
                    </span>

                    <h4 className="mt-2 line-clamp-3 text-[18px] font-bold leading-snug text-slate-900">
                      {post.title}
                    </h4>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-slate-300 px-6 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Chưa có bài viết để hiển thị.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
