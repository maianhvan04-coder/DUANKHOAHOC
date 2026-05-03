"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { blogApi, type BlogItem } from "@/app/api/blog.api";

const FALLBACK_IMAGE = "/Knowledge/Featured/knowledge-1.png";
const RELATED_FALLBACK_IMAGES = [
  "/Knowledge/PostGrid/post-grid-1.jpg",
  "/Knowledge/PostGrid/post-grid-2.jpg",
  "/Knowledge/PostGrid/post-grid-3.jpg",
  "/Knowledge/PostGrid/post-grid-4.jpg",
];

type TocItem = {
  id: string;
  level: number;
  number: string;
  text: string;
};

function createHeadingId(value: string, fallback: string) {
  const id = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return id || fallback;
}

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
  return RELATED_FALLBACK_IMAGES[index % RELATED_FALLBACK_IMAGES.length];
}

function getPostHref(post: BlogItem) {
  return `/goc-kien-thuc/${encodeURIComponent(post.slug || post._id)}`;
}

export default function KnowledgePostDetailPage() {
  const params = useParams<{ slug?: string }>();
  const slug = useMemo(() => {
    const value = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    return value ? decodeURIComponent(value) : "";
  }, [params.slug]);

  const [post, setPost] = useState<BlogItem | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogItem[]>([]);
  const [contentHtml, setContentHtml] = useState("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
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

  useEffect(() => {
    if (!post?.content) {
      setContentHtml("");
      setTocItems([]);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = post.content;

    const usedIds = new Set<string>();
    const headings = Array.from(
      wrapper.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")
    );
    const counters = [0, 0, 0, 0, 0, 0];

    const nextTocItems = headings.map((heading, index) => {
      const text =
        heading.textContent?.replace(/\s+/g, " ").trim() || `Mục ${index + 1}`;
      const level = Number(heading.tagName.replace("H", ""));
      counters[level - 1] += 1;
      for (let cursor = level; cursor < counters.length; cursor += 1) {
        counters[cursor] = 0;
      }
      const number =
        level <= 2
          ? String(counters[level - 1])
          : counters
              .slice(1, level)
              .filter(Boolean)
              .join(".");
      const baseId = createHeadingId(
        heading.id || text,
        `muc-${index + 1}`
      );
      let id = baseId;
      let suffix = 2;

      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      usedIds.add(id);
      heading.id = id;
      heading.classList.add("scroll-mt-28");

      return {
        id,
        level,
        number,
        text,
      };
    });

    setContentHtml(wrapper.innerHTML);
    setTocItems(nextTocItems);
  }, [post]);

  useEffect(() => {
    if (!post) {
      setRelatedPosts([]);
      return;
    }

    let mounted = true;
    const currentPost = post;

    async function loadRelatedPosts() {
      try {
        const [sameCategoryRes, latestRes] = await Promise.all([
          blogApi.getAll({
            category: currentPost.category,
            limit: 8,
            sortBy: "publishedAt",
            sortOrder: "desc",
          }),
          blogApi.getAll({
            limit: 8,
            sortBy: "publishedAt",
            sortOrder: "desc",
          }),
        ]);

        const seen = new Set([currentPost._id]);
        const nextPosts: BlogItem[] = [];

        [...(sameCategoryRes.items || []), ...(latestRes.items || [])].forEach(
          (item) => {
            if (seen.has(item._id) || nextPosts.length >= 4) return;
            seen.add(item._id);
            nextPosts.push(item);
          }
        );

        if (mounted) setRelatedPosts(nextPosts);
      } catch (error) {
        console.error("Load related knowledge posts failed:", error);
        if (mounted) setRelatedPosts([]);
      }
    }

    void loadRelatedPosts();

    return () => {
      mounted = false;
    };
  }, [post]);

  const image = isAllowedImage(post?.image) ? post?.image || "" : FALLBACK_IMAGE;

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-6">
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
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="relative aspect-[16/7.5] w-full overflow-hidden rounded-[24px] bg-slate-100">
                  <Image
                    src={image}
                    alt={post.title}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                <div id="noi-dung-bai-viet" className="mt-8 max-w-none scroll-mt-28">
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
                    dangerouslySetInnerHTML={{ __html: contentHtml || post.content }}
                  />
                </div>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-28 rounded-[20px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">
                    Phụ lục bài viết
                  </p>

                  <nav className="mt-4 max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto pr-1">
                    <a
                      href="#noi-dung-bai-viet"
                      className="block rounded-xl px-3 py-2 text-sm font-bold text-[#0b4b84] transition hover:bg-white"
                    >
                      Tổng quan
                    </a>

                    {tocItems.length ? (
                      tocItems.map((item, index) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={[
                            "block rounded-xl py-2 leading-6 text-slate-600 transition hover:bg-white hover:text-[#0b4b84]",
                            item.level <= 2
                              ? "px-3 text-sm font-bold"
                              : item.level === 3
                              ? "pl-7 pr-3 text-[13px] font-semibold"
                              : "pl-10 pr-3 text-[12px] font-medium",
                          ].join(" ")}
                        >
                          <span className="mr-2 text-slate-400">
                            {item.number || index + 1}.
                          </span>
                          {item.text}
                        </a>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm leading-6 text-slate-500">
                        Bài viết chưa có tiêu đề phụ.
                      </p>
                    )}
                  </nav>
                </div>
              </aside>
            </div>

            {relatedPosts.length ? (
              <section className="mx-auto mt-14 max-w-[1240px] border-t border-slate-200 pt-8">
                <h2 className="text-center text-[26px] font-black text-slate-950 md:text-[32px]">
                  Bài viết liên quan
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {relatedPosts.map((item, index) => (
                    <Link
                      key={item._id}
                      href={getPostHref(item)}
                      className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
                    >
                      <div className="relative aspect-[1.45/1] w-full bg-slate-100">
                        <Image
                          src={getPostImage(item, index)}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="p-4">
                        <span className="inline-flex rounded-full bg-[#1ba6a6] px-3 py-1 text-xs font-semibold text-white">
                          {item.category}
                        </span>

                        <h3 className="mt-3 line-clamp-2 text-[20px] font-bold leading-tight text-slate-900">
                          {item.title}
                        </h3>

                        <p className="mt-3 line-clamp-2 text-[14px] leading-6 text-slate-600">
                          {item.excerpt || item.content}
                        </p>

                        <p className="mt-4 text-sm font-medium text-slate-500">
                          {formatDate(item.publishedAt || item.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
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
