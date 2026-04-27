import { isValidObjectId, Types } from "mongoose";
import { productRepository } from "./course.repository";
import type { ProductLevel, ProductMode, ProductStatus } from "./course.model";
import { CategoryModel } from "../category/category.model";
import { TeacherModel } from "../teacher/teacher.model";
import { studentStudyRepository } from "../student/repository/student-study.repository";
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

function toObjectId(id: string, message = "ID không hợp lệ") {
  if (!isValidObjectId(id)) {
    throw new Error(message);
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
  if (!isValidObjectId(categoryId)) {
    throw new Error("Danh mục không hợp lệ");
  }

  const category = await CategoryModel.findOne({
    _id: categoryId,
    isDeleted: false,
  });

  if (!category) {
    throw new Error("Danh mục không tồn tại");
  }

  return category;
}

async function resolveTeacherFields(teacherId?: string) {
  if (teacherId === undefined) {
    return undefined;
  }

  const rawTeacherId = teacherId.trim();

  if (!rawTeacherId) {
    return {
      teacher: null,
      teacherName: "",
    };
  }

  if (!isValidObjectId(rawTeacherId)) {
    throw new Error("Giảng viên không hợp lệ");
  }

  const teacherDoc = await TeacherModel.findById(rawTeacherId).populate({
    path: "user",
    select: "name",
  });

  if (!teacherDoc) {
    throw new Error("Giảng viên không tồn tại");
  }

  const teacherUser = teacherDoc.user as { name?: string } | null | undefined;

  return {
    teacher: new Types.ObjectId(String(teacherDoc._id)),
    teacherName: String(teacherUser?.name || ""),
  };
}

async function getStudentCountByCourseId(courseId: string) {
  return studentStudyRepository.countDocuments({
    course: courseId,
    isActive: true,
  });
}

type CreateProductPayload = {
  title: string;
  shortDescription?: string;
  teacher?: string;
  category: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  durationText?: string;
  price: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode[] | ProductMode;
};

type UpdateProductPayload = {
  title?: string;
  shortDescription?: string;
  teacher?: string;
  category?: string;
  level?: ProductLevel;
  status?: ProductStatus;
  rating?: string;
  durationText?: string;
  price?: string;
  isActive?: boolean | "true" | "false";
  modes?: ProductMode[] | ProductMode;
};

type ProductImagePayload = {
  image: string;
  imagePublicId: string;
};

function getCategoryName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  return String((value as { name?: unknown }).name || "");
}

function sortProducts<T extends Record<string, any>>(
  items: T[],
  query: ListQueryInput,
  deleted: boolean
) {
  const sortBy = getQueryString(query, ["sortBy", "sort"]);
  const sortOrder = normalizeSortOrder(query.sortOrder ?? query.order);
  const sortField = sortBy || (deleted ? "deletedAt" : "createdAt");

  return [...items].sort((left, right) => {
    const pick = (item: T) => {
      switch (sortField) {
        case "title":
          return item.title;
        case "category":
          return getCategoryName(item.category);
        case "teacher":
          return item.teacherName;
        case "status":
          return item.status;
        case "price":
          return item.price;
        case "deletedAt":
          return item.deletedAt;
        case "createdAt":
        default:
          return item.createdAt;
      }
    };

    return compareListValues(pick(left), pick(right), sortOrder);
  });
}

export const productService = {
  async getAll(query: ListQueryInput & { categoryId?: string } = {}) {
    const items = await productRepository.findAll(query);

    const mapped = await Promise.all(
      items.map(async (item) => {
        const studentCount = await getStudentCountByCourseId(String(item._id));

        return {
          ...item.toObject(),
          studentCount,
        };
      })
    );

    const sorted = sortProducts(mapped, query, false);
    const pagination = parsePagination(query);
    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getDeleted(query: ListQueryInput = {}) {
    const items = await productRepository.findAllDeleted(query);
    const mapped = items.map((item) => item.toObject());
    const sorted = sortProducts(mapped, query, true);
    const pagination = parsePagination(query);
    return makeListResponse(
      paginateArray(sorted, pagination),
      sorted.length,
      pagination
    );
  },

  async getById(id: string) {
    const item = await productRepository.findByIdWithCategory(id);

    if (!item) {
      throw new Error("Không tìm thấy khóa học");
    }

    const studentCount = await getStudentCountByCourseId(String(item._id));

    return {
      ...item.toObject(),
      studentCount,
    };
  },

  async create(payload: CreateProductPayload, imageData?: ProductImagePayload) {
    await ensureCategoryExists(payload.category);

    const slug = slugify(payload.title);
    const exists = await productRepository.findBySlug(slug);

    if (exists) {
      throw new Error("Khóa học đã tồn tại");
    }

    const teacherFields =
      (await resolveTeacherFields(payload.teacher)) ?? {
        teacher: null,
        teacherName: "",
      };

    const created = await productRepository.create({
      title: payload.title.trim(),
      slug,
      shortDescription: payload.shortDescription?.trim() || "",
      teacher: teacherFields.teacher,
      teacherName: teacherFields.teacherName,
      category: toObjectId(payload.category, "Danh mục không hợp lệ"),
      level: payload.level || "Cơ bản",
      status: payload.status || "OPEN",
      rating: toNumber(payload.rating, 0),
      durationText: payload.durationText?.trim() || "",
      price: toNumber(payload.price, 0),
      isActive: toBoolean(payload.isActive, true),
      modes: normalizeModes(payload.modes, ["ONLINE"]),
      image: imageData?.image || "",
      imagePublicId: imageData?.imagePublicId || "",
    });

    const item = await productRepository.findByIdWithCategory(String(created._id));

    if (!item) {
      throw new Error("Tạo khóa học thất bại");
    }

    const studentCount = await getStudentCountByCourseId(String(item._id));

    return {
      ...item.toObject(),
      studentCount,
    };
  },

  async update(
    id: string,
    payload: UpdateProductPayload,
    imageData?: ProductImagePayload
  ) {
    const current = await productRepository.findById(id);

    if (!current) {
      throw new Error("Không tìm thấy khóa học");
    }

    const updateData: {
      title?: string;
      slug?: string;
      shortDescription?: string;
      teacher?: Types.ObjectId | null;
      teacherName?: string;
      category?: Types.ObjectId;
      level?: ProductLevel;
      status?: ProductStatus;
      rating?: number;
      durationText?: string;
      price?: number;
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
      updateData.category = toObjectId(payload.category, "Danh mục không hợp lệ");
    }

    if (payload.shortDescription !== undefined) {
      updateData.shortDescription = payload.shortDescription.trim();
    }

    if (payload.teacher !== undefined) {
      const teacherFields = await resolveTeacherFields(payload.teacher);
      updateData.teacher = teacherFields?.teacher ?? null;
      updateData.teacherName = teacherFields?.teacherName ?? "";
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

    if (payload.durationText !== undefined) {
      updateData.durationText = payload.durationText.trim();
    }

    if (payload.price !== undefined) {
      updateData.price = toNumber(payload.price, current.price);
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

    const studentCount = await getStudentCountByCourseId(String(updated._id));

    return {
      ...updated.toObject(),
      studentCount,
    };
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
