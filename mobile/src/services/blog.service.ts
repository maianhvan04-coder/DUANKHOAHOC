import { API_BASE_URL, API_ENDPOINTS } from "../constants/api";
import type {
  BlogItem,
  BlogListData,
  BlogListQuery,
  BlogPagination,
} from "../types/blog.type";
import { httpClient } from "../utils/httpClient";

type AnyObj = Record<string, unknown>;

function isObject(value: unknown): value is AnyObj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeImageUrl(value: unknown) {
  const image = asString(value).trim();
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${API_BASE_URL}${image}`;
  return image;
}

function normalizePagination(raw: unknown, itemsLength: number): BlogPagination {
  const obj = isObject(raw) ? raw : {};
  const page = Number(obj.page ?? 1);
  const limit = Number(obj.limit ?? Math.max(itemsLength, 1));
  const total = Number(obj.total ?? itemsLength);
  const totalPages = Number(
    obj.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)))
  );

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit:
      Number.isFinite(limit) && limit > 0 ? limit : Math.max(itemsLength, 1),
    total: Number.isFinite(total) && total >= 0 ? total : itemsLength,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

function getResponsePayload(response: unknown) {
  if (!isObject(response)) return {};

  if (isObject(response.data)) return response.data;

  return response;
}

function getResponseItems(payload: AnyObj) {
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (isObject(payload.data) && Array.isArray(payload.data.items)) {
    return payload.data.items;
  }

  return [];
}

function normalizeBlog(raw: unknown): BlogItem {
  const obj = isObject(raw) ? raw : {};

  return {
    _id: asString(obj._id) || asString(obj.id),
    title: asString(obj.title, "Bài viết Everest"),
    slug: asString(obj.slug),
    excerpt: asString(obj.excerpt),
    content: asString(obj.content),
    category: asString(obj.category, "Tin tức"),
    tags: normalizeTags(obj.tags),
    image: normalizeImageUrl(obj.image),
    imagePublicId: asString(obj.imagePublicId),
    authorName: asString(obj.authorName, "Everest"),
    isFeatured: asBoolean(obj.isFeatured),
    isPublished: asBoolean(obj.isPublished, true),
    publishedAt: typeof obj.publishedAt === "string" ? obj.publishedAt : null,
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

export const blogService = {
  async getAll(query?: BlogListQuery): Promise<BlogListData> {
    const response = await httpClient.get<unknown>(API_ENDPOINTS.blogs.list, {
      params: query,
      skipAuth: true,
    });

    const payload = getResponsePayload(response);
    const rawItems = getResponseItems(payload);
    const items = rawItems.map(normalizeBlog);

    return {
      items,
      pagination: normalizePagination(payload.pagination, items.length),
    };
  },
};
