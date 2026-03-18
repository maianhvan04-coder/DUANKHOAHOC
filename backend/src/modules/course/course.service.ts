import { isValidObjectId, Types } from "mongoose";
import { productRepository } from "./course.repository";
import type { ProductLevel, ProductMode, ProductStatus } from "./course.model";
import { CategoryModel } from "../category/category.model";
import { slugify } from "../../utils/slug";

function toObjectId(id: string) {
  if (!isValidObjectId(id)) {
    throw new Error("Danh mục không hợp lệ");
  }

  return new Types.ObjectId(id);
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeModes(
  value?: ProductMode[] | ProductMode,
  fallback: ProductMode[] = ["ONLINE"]
): ProductMode[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value) && value.length > 0) {
    return value;
  }

  return fallback;
}

async function ensureCategoryExists(categoryId: string) {
  const category = await CategoryModel.findOne({
    _id: categoryId,
    isDeleted: false,
  });

  if (!category) {
    throw new Error("Danh mục không tồn tại");
  }

  return category;
}

type CreateProductPayload = {
  title: string;
  shortDescription?: string;
  teacherName?: string;
  category: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  studentCount?: string;
  durationText?: string;
  price: string;
  originalPrice?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode[] | ProductMode;
};

type UpdateProductPayload = {
  title?: string;
  shortDescription?: string;
  teacherName?: string;
  category?: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  studentCount?: string;
  durationText?: string;
  price?: string;
  originalPrice?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode[] | ProductMode;
};

type ProductImagePayload = {
  image: string;
  imagePublicId: string;
};

export const productService = {
  async getAll(query: { categoryId?: string; limit?: string }) {
    return productRepository.findAll(query);
  },

  async getDeleted() {
    return productRepository.findAllDeleted();
  },

  async getById(id: string) {
    const item = await productRepository.findByIdWithCategory(id);

    if (!item) {
      throw new Error("Không tìm thấy khóa học");
    }

    return item;
  },

  async create(payload: CreateProductPayload, imageData?: ProductImagePayload) {
    await ensureCategoryExists(payload.category);

    const slug = slugify(payload.title);
    const exists = await productRepository.findBySlug(slug);

    if (exists) {
      throw new Error("Khóa học đã tồn tại");
    }

    const created = await productRepository.create({
      title: payload.title.trim(),
      slug,
      shortDescription: payload.shortDescription?.trim() || "",
      teacherName: payload.teacherName?.trim() || "",
      category: toObjectId(payload.category),
      level: payload.level || "Cơ bản",
      status: payload.status || "OPEN",
      rating: toNumber(payload.rating, 0),
      studentCount: toNumber(payload.studentCount, 0),
      durationText: payload.durationText?.trim() || "",
      price: toNumber(payload.price, 0),
      originalPrice: toNumber(payload.originalPrice, 0),
      isActive: toBoolean(payload.isActive, true),
      modes: normalizeModes(payload.modes, ["ONLINE"]),
      image: imageData?.image || "",
      imagePublicId: imageData?.imagePublicId || "",
    });

    return productRepository.findByIdWithCategory(String(created._id));
  },

  async update(id: string, payload: UpdateProductPayload, imageData?: ProductImagePayload) {
    const current = await productRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy khóa học");
    }

    const updateData: {
      title?: string;
      slug?: string;
      shortDescription?: string;
      teacherName?: string;
      category?: Types.ObjectId;
      level?: ProductLevel;
      status?: ProductStatus;
      rating?: number;
      studentCount?: number;
      durationText?: string;
      price?: number;
      originalPrice?: number;
      isActive?: boolean;
      modes?: ProductMode[];
      image?: string;
      imagePublicId?: string;
    } = {};

    if (payload.title?.trim()) {
      const nextTitle = payload.title.trim();

      if (nextTitle !== current.title) {
        const nextSlug = slugify(nextTitle);
        const exists = await productRepository.findBySlugExcludeId(nextSlug, id);

        if (exists) {
          throw new Error("Khóa học đã tồn tại");
        }

        updateData.title = nextTitle;
        updateData.slug = nextSlug;
      }
    }

    if (payload.category) {
      await ensureCategoryExists(payload.category);
      updateData.category = toObjectId(payload.category);
    }

    if (payload.shortDescription !== undefined) {
      updateData.shortDescription = payload.shortDescription;
    }

    if (payload.teacherName !== undefined) {
      updateData.teacherName = payload.teacherName;
    }

    if (payload.level !== undefined) {
      updateData.level = payload.level;
    }

    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }

    if (payload.rating !== undefined) {
      updateData.rating = toNumber(payload.rating, current.rating);
    }

    if (payload.studentCount !== undefined) {
      updateData.studentCount = toNumber(payload.studentCount, current.studentCount);
    }

    if (payload.durationText !== undefined) {
      updateData.durationText = payload.durationText;
    }

    if (payload.price !== undefined) {
      updateData.price = toNumber(payload.price, current.price);
    }

    if (payload.originalPrice !== undefined) {
      updateData.originalPrice = toNumber(
        payload.originalPrice,
        current.originalPrice
      );
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = toBoolean(payload.isActive, current.isActive);
    }

    if (payload.modes !== undefined) {
      updateData.modes = normalizeModes(payload.modes, current.modes);
    }

    if (imageData) {
      updateData.image = imageData.image;
      updateData.imagePublicId = imageData.imagePublicId;
    }

    const updated = await productRepository.updateById(id, updateData);

    if (!updated) {
      throw new Error("Không tìm thấy khóa học");
    }

    return updated;
  },

  async softDelete(id: string) {
    const item = await productRepository.findById(id);

    if (!item) {
      throw new Error("Không tìm thấy khóa học");
    }

    const deleted = await productRepository.softDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy khóa học");
    }

    return deleted;
  },

  async restore(id: string) {
    const item = await productRepository.findDeletedById(id);

    if (!item) {
      throw new Error("Không tìm thấy khóa học đã xóa");
    }

    const exists = await productRepository.findBySlug(item.slug);
    if (exists) {
      throw new Error("Slug khóa học đã bị dùng bởi dữ liệu khác, không thể khôi phục");
    }

    await ensureCategoryExists(String(item.category));

    const restored = await productRepository.restoreById(id);

    if (!restored) {
      throw new Error("Khôi phục thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    const item = await productRepository.findAnyById(id);

    if (!item) {
      throw new Error("Không tìm thấy khóa học");
    }

    const deleted = await productRepository.forceDeleteById(id);

    if (!deleted) {
      throw new Error("Không tìm thấy khóa học");
    }

    return deleted;
  },
};