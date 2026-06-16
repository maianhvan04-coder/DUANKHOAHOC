import { isValidObjectId, Types } from "mongoose";
import { blogCategoryRepository } from "./category/blog-category.repository";
import { blogRepository } from "./blog.repository";
import { slugify } from "../../utils/slug";
import {
  compareListValues,
  getQueryString,
  makeListResponse,
  normalizeSortOrder,
  paginateArray,
  parsePagination,
  type ListQueryInput,
} from "../../utils/list-query";

type BooleanLike = boolean | "true" | "false";

type CreateBlogPayload = {
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  tags?: string[] | string;
  authorName?: string;
  isFeatured?: BooleanLike;
  isPublished?: BooleanLike;
  publishedAt?: string;
};

type UpdateBlogPayload = Partial<CreateBlogPayload>;

type BlogImagePayload = {
  image: string;
  imagePublicId: string;
};

type BlogUserPayload = {
  id?: string;
  name?: string;
  email?: string;
};

type BlogListOptions = {
  publicOnly?: boolean;
};

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeTags(value?: string[] | string) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");

  return raw
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function getAuthorName(payload?: CreateBlogPayload | UpdateBlogPayload, user?: BlogUserPayload) {
  return (
    payload?.authorName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "Everest"
  );
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPublishedAt(
  isPublished: boolean,
  current?: Date | string | null,
  requested?: string
) {
  if (!isPublished) return null;

  const requestedDate = parseDate(requested);
  if (requestedDate) return requestedDate;

  if (current) {
    const date = parseDate(String(current));
    if (date) return date;
  }

  return new Date();
}

function sortBlogs<T extends Record<string, any>>(items: T[], query: ListQueryInput) {
  const sortBy = getQueryString(query, ["sortBy", "sort"]);
  const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
  const sortField = sortBy || "publishedAt";

  return [...items].sort((left, right) => {
    const pick = (item: T) => {
      switch (sortField) {
        case "title":
          return item.title;
        case "category":
          return item.category;
        case "isPublished":
          return item.isPublished;
        case "isFeatured":
          return item.isFeatured;
        case "createdAt":
          return item.createdAt;
        case "updatedAt":
          return item.updatedAt;
        case "deletedAt":
          return item.deletedAt;
        case "publishedAt":
        default:
          return item.publishedAt || item.createdAt;
      }
    };

    return compareListValues(pick(left), pick(right), sortOrder);
  });
}

function assertObjectId(id: string) {
  if (!isValidObjectId(id)) {
    throw new Error("ID bài viết không hợp lệ");
  }
}

async function ensureBlogCategoryExists(name: string) {
  const category = await blogCategoryRepository.findByName(name.trim());
  if (!category) {
    throw new Error("Chuyên mục blog không tồn tại");
  }

  return category;
}

export const blogService = {
  async getAll(query: ListQueryInput = {}, options: BlogListOptions = {}) {
    const items = await blogRepository.findAll(query, options);
    const mapped = items.map((item) => item.toObject());
    const sorted = sortBlogs(mapped, query);
    const pagination = parsePagination(query, 10, 100);

    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getDeleted(query: ListQueryInput = {}) {
    const items = await blogRepository.findAllDeleted(query);
    const mapped = items.map((item) => item.toObject());
    const sorted = sortBlogs(mapped, query);
    const pagination = parsePagination(query, 10, 100);

    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getPublishedByIdOrSlug(value: string) {
    const item = await blogRepository.findPublishedByIdOrSlug(value);
    if (!item) {
      throw new Error("Không tìm thấy bài viết");
    }

    return item;
  },

  async getById(id: string) {
    assertObjectId(id);

    const item = await blogRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy bài viết");
    }

    return item;
  },

  async create(
    payload: CreateBlogPayload,
    imageData?: BlogImagePayload,
    user?: BlogUserPayload
  ) {
    await ensureBlogCategoryExists(payload.category);

    const slug = slugify(payload.title);
    const exists = await blogRepository.findBySlug(slug);

    if (exists) {
      throw new Error("Bài viết đã tồn tại");
    }

    const isPublished = toBoolean(payload.isPublished, true);

    return blogRepository.create({
      title: payload.title.trim(),
      slug,
      excerpt: payload.excerpt?.trim() || "",
      content: payload.content.trim(),
      category: payload.category.trim(),
      tags: normalizeTags(payload.tags),
      image: imageData?.image || "",
      imagePublicId: imageData?.imagePublicId || "",
      authorName: getAuthorName(payload, user),
      createdBy: user?.id && isValidObjectId(user.id) ? new Types.ObjectId(user.id) : null,
      isFeatured: toBoolean(payload.isFeatured, false),
      isPublished,
      publishedAt: getPublishedAt(isPublished, null, payload.publishedAt),
    });
  },

  async update(id: string, payload: UpdateBlogPayload, imageData?: BlogImagePayload) {
    assertObjectId(id);

    const current = await blogRepository.findById(id);
    if (!current) {
      throw new Error("Không tìm thấy bài viết");
    }

    const updateData: Parameters<typeof blogRepository.updateById>[1] = {};

    if (payload.title !== undefined) {
      const title = payload.title.trim();
      const slug = slugify(title);
      const exists = await blogRepository.findBySlugExcludeId(slug, id);

      if (exists) {
        throw new Error("Bài viết đã tồn tại");
      }

      updateData.title = title;
      updateData.slug = slug;
    }

    if (payload.excerpt !== undefined) {
      updateData.excerpt = payload.excerpt.trim();
    }

    if (payload.content !== undefined) {
      updateData.content = payload.content.trim();
    }

    if (payload.category !== undefined) {
      await ensureBlogCategoryExists(payload.category);
      updateData.category = payload.category.trim();
    }

    if (payload.tags !== undefined) {
      updateData.tags = normalizeTags(payload.tags);
    }

    if (payload.authorName !== undefined) {
      updateData.authorName = payload.authorName.trim();
    }

    if (payload.isFeatured !== undefined) {
      updateData.isFeatured = toBoolean(payload.isFeatured, false);
    }

    if (payload.isPublished !== undefined || payload.publishedAt !== undefined) {
      const nextPublished =
        payload.isPublished !== undefined
          ? toBoolean(payload.isPublished, true)
          : current.isPublished !== false;
      updateData.isPublished = nextPublished;
      updateData.publishedAt = getPublishedAt(
        nextPublished,
        current.publishedAt,
        payload.publishedAt
      );
    }

    if (imageData) {
      updateData.image = imageData.image;
      updateData.imagePublicId = imageData.imagePublicId;
    }

    const updated = await blogRepository.updateById(id, updateData);
    if (!updated) {
      throw new Error("Không tìm thấy bài viết");
    }

    return updated;
  },

  async softDelete(id: string) {
    assertObjectId(id);

    const item = await blogRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy bài viết");
    }

    const deleted = await blogRepository.softDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy bài viết");
    }

    return deleted;
  },

  async restore(id: string) {
    assertObjectId(id);

    const item = await blogRepository.findDeletedById(id);
    if (!item) {
      throw new Error("Không tìm thấy bài viết đã xóa");
    }

    const exists = await blogRepository.findBySlug(item.slug);
    if (exists) {
      throw new Error("Slug bài viết đã được dùng, không thể khôi phục");
    }

    const restored = await blogRepository.restoreById(id);
    if (!restored) {
      throw new Error("Khôi phục bài viết thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    assertObjectId(id);

    const item = await blogRepository.findAnyById(id);
    if (!item) {
      throw new Error("Không tìm thấy bài viết");
    }

    const deleted = await blogRepository.forceDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy bài viết");
    }

    return deleted;
  },
};
