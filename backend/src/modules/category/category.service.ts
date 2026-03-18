import { categoryRepository } from "./category.repository";
import { ProductModel } from "../course/course.model";
import { slugify } from "../../utils/slug";

export const categoryService = {
  async getAll() {
    return categoryRepository.findAllActive();
  },

  async getDeleted() {
    return categoryRepository.findAllDeleted();
  },

  async create(payload: { name: string; description?: string }) {
    const slug = slugify(payload.name);

    const exists = await categoryRepository.findBySlug(slug);
    if (exists) {
      throw new Error("Danh mục đã tồn tại");
    }

    return categoryRepository.create({
      name: payload.name.trim(),
      slug,
      description: payload.description || "",
    });
  },

  async update(
    id: string,
    payload: { name?: string; description?: string; isActive?: boolean }
  ) {
    const item = await categoryRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy danh mục");
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    } = {};

    if (payload.name?.trim()) {
      const nextSlug = slugify(payload.name);
      const exists = await categoryRepository.findBySlugExcludeId(nextSlug, id);

      if (exists) {
        throw new Error("Danh mục đã tồn tại");
      }

      updateData.name = payload.name.trim();
      updateData.slug = nextSlug;
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description;
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }

    const updated = await categoryRepository.updateById(id, updateData);
    if (!updated) {
      throw new Error("Không tìm thấy danh mục");
    }

    return updated;
  },

  async softDelete(id: string) {
    const item = await categoryRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy danh mục");
    }

    const used = await ProductModel.findOne({
      category: id,
      isDeleted: false,
    });

    if (used) {
      throw new Error("Danh mục đang có khóa học, không thể xóa mềm");
    }

    const deleted = await categoryRepository.softDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy danh mục");
    }

    return deleted;
  },

  async restore(id: string) {
    const item = await categoryRepository.findDeletedById(id);
    if (!item) {
      throw new Error("Không tìm thấy danh mục đã xóa");
    }

    const exists = await categoryRepository.findBySlug(item.slug);
    if (exists) {
      throw new Error("Slug danh mục đã bị dùng bởi dữ liệu khác, không thể khôi phục");
    }

    const restored = await categoryRepository.restoreById(id);
    if (!restored) {
      throw new Error("Khôi phục thất bại");
    }

    return restored;
  },

  async forceDelete(id: string) {
    const item = await categoryRepository.findAnyById(id);
    if (!item) {
      throw new Error("Không tìm thấy danh mục");
    }

    const used = await ProductModel.findOne({
      category: id,
      isDeleted: false,
    });

    if (used) {
      throw new Error("Danh mục đang có khóa học, không thể xóa cứng");
    }

    const deleted = await categoryRepository.forceDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy danh mục");
    }

    return deleted;
  },
};