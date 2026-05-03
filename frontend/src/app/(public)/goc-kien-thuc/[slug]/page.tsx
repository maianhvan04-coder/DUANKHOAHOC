"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { blogApi, type BlogItem } from "@/app/api/blog.api";

const FALLBACK_IMAGE = "/Knowledge/Featured/knowledge-1.png";

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

export default function KnowledgePostDetailPage() {
  const params = useParams<{ slug?: string }>();
  const slug = useMemo(() => {
    const value = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    return value ? decodeURIComponent(value) : "";
  }, [params.slug]);

  const [post, setPost] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    async function loadPost() {
      try {
        setLoading(true);
        setErrorMessage("");
        const res = await blogApi.getById(slug);

        if (mounted) setPost(res.item);
      } catch (error) {
        console.error("Load knowledge post failed:", error);
        if (mounted) {
          setPost(null);
          setErrorMessage("Không tìm thấy bài viết hoặc bài viết chưa được xuất bản.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPost();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const image = isAllowedImage(post?.image) ? post?.image || "" : FALLBACK_IMAGE;

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:px-8">
        <Link
          href="/goc-kien-thuc"
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Góc kiến thức
        </Link>

        {loading ? (
          <div className="mt-8 space-y-5">
            <div className="h-[360px] animate-pulse rounded-[22px] bg-slate-100" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        ) : post ? (
          <article className="mt-8">
            <div className="relative aspect-[16/7.5] w-full overflow-hidden rounded-[24px] bg-slate-100">
              <Image
                src={image}
                alt={post.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            <div className="mx-auto mt-8 max-w-3xl">
              <span className="inline-flex rounded-full bg-[#0b4b84] px-4 py-1.5 text-sm font-semibold text-white">
                {post.category}
              </span>

              <h1 className="mt-4 text-[34px] font-black leading-tight text-slate-950 md:text-[46px]">
                {post.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                <span>{post.authorName || "Everest"}</span>
                <span aria-hidden="true">•</span>
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              </div>

              {post.excerpt ? (
                <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-[17px] leading-8 text-slate-700">
                  {post.excerpt}
                </p>
              ) : null}

              <div
                className="prose prose-slate mt-8 max-w-none text-[17px] leading-8 prose-headings:text-slate-950 prose-a:text-[#0b4b84] prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        ) : (
          <div className="mt-8 rounded-[18px] border border-dashed border-slate-300 px-6 py-14 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {errorMessage || "Không tìm thấy bài viết."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
