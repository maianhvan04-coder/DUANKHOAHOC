import { isValidObjectId } from "mongoose";
import { blogCategoryRepository } from "./blog-category.repository";
import { BlogModel } from "../blog.model";
import { slugify } from "../../../utils/slug";

type BlogCategoryPayload = {
  name: string;
  description?: string;
  isActive?: boolean;
};

function assertObjectId(id: string) {
  if (!isValidObjectId(id)) {
    throw new Error("ID chuyên mục không hợp lệ");
  }
}

export const blogCategoryService = {
  async getAll() {
    return blogCategoryRepository.findAllActive();
  },

  async getAdminAll() {
    return blogCategoryRepository.findAllAdmin();
  },

  async getDeleted() {
    return blogCategoryRepository.findAllDeleted();
  },

  async create(payload: BlogCategoryPayload) {
    const name = payload.name.trim();
    const slug = slugify(name);

    const exists = await blogCategoryRepository.findBySlug(slug);
    if (exists) {
      throw new Error("Chuyên mục blog đã tồn tại");
    }

    return blogCategoryRepository.create({
      name,
      slug,
      description: payload.description?.trim() || "",
      isActive: payload.isActive ?? true,
    });
  },

  async update(id: string, payload: Partial<BlogCategoryPayload>) {
    assertObjectId(id);

    const item = await blogCategoryRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    } = {};

    if (payload.name !== undefined) {
      const name = payload.name.trim();
      const slug = slugify(name);
      const exists = await blogCategoryRepository.findBySlugExcludeId(slug, id);

      if (exists) {
        throw new Error("Chuyên mục blog đã tồn tại");
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description.trim();
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }

    const updated = await blogCategoryRepository.updateById(id, updateData);
    if (!updated) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    return updated;
  },

  async softDelete(id: string) {
    assertObjectId(id);

    const item = await blogCategoryRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    const used = await BlogModel.findOne({
      category: item.name,
      isDeleted: false,
    });

    if (used) {
      throw new Error("Chuyên mục đang có bài viết, không thể xóa");
    }

    const deleted = await blogCategoryRepository.softDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    return deleted;
  },

  async restore(id: string) {
    assertObjectId(id);

    const item = await blogCategoryRepository.findDeletedById(id);
    if (!item) {
      throw new Error("Không tìm thấy chuyên mục blog đã xóa");
    }

    const exists = await blogCategoryRepository.findBySlug(item.slug);
    if (exists) {
      throw new Error("Slug chuyên mục đã được dùng, không thể khôi phục");
    }

    const restored = await blogCategoryRepository.restoreById(id);
    if (!restored) {
      throw new Error("Khôi phục chuyên mục thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    assertObjectId(id);

    const item = await blogCategoryRepository.findAnyById(id);
    if (!item) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    const used = await BlogModel.findOne({
      category: item.name,
      isDeleted: false,
    });

    if (used) {
      throw new Error("Chuyên mục đang có bài viết, không thể xóa cứng");
    }

    const deleted = await blogCategoryRepository.forceDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy chuyên mục blog");
    }

    return deleted;
  },
};
