import { categoryRepository } from "./category.repository";
import { ProductModel } from "../course/course.model";
import { slugify } from "../../utils/slug";

type CategoryPayload = {
  name: string;
  description?: string;
  parent?: string | null;
  isActive?: boolean;
};

type CategoryUpdatePayload = {
  name?: string;
  description?: string;
  parent?: string | null;
  isActive?: boolean;
};

type CategoryTreeItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  parent: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  children: CategoryTreeItem[];
};

function toPlainCategory(item: any): Omit<CategoryTreeItem, "children"> {
  const raw = typeof item.toObject === "function" ? item.toObject() : item;

  return {
    _id: String(raw._id),
    name: raw.name || "",
    slug: raw.slug || "",
    description: raw.description || "",
    parent: raw.parent ? String(raw.parent) : null,
    isActive: raw.isActive !== false,
    isDeleted: !!raw.isDeleted,
    deletedAt: raw.deletedAt || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildCategoryTree(items: any[]) {
  const plainItems = items.map(toPlainCategory);
  const ids = new Set(plainItems.map((item) => item._id));
  const byParent = new Map<string | null, Omit<CategoryTreeItem, "children">[]>();

  for (const item of plainItems) {
    const parentKey = item.parent && ids.has(item.parent) ? item.parent : null;
    const current = byParent.get(parentKey) || [];
    current.push(item);
    byParent.set(parentKey, current);
  }

  const attachChildren = (
    parentId: string | null,
    visited = new Set<string>()
  ): CategoryTreeItem[] => {
    const children = byParent.get(parentId) || [];

    return children.map((item) => {
      if (visited.has(item._id)) {
        return {
          ...item,
          children: [],
        };
      }

      const nextVisited = new Set(visited);
      nextVisited.add(item._id);

      return {
        ...item,
        children: attachChildren(item._id, nextVisited),
      };
    });
  };

  return attachChildren(null);
}

async function normalizeParent(parent?: string | null) {
  if (!parent) return null;

  const parentItem = await categoryRepository.findById(parent);
  if (!parentItem) {
    throw new Error("Danh mục cha không tồn tại");
  }

  return parent;
}

function collectDescendantIds(
  items: any[],
  parentId: string,
  result = new Set<string>()
) {
  const plainItems = items.map(toPlainCategory);

  const walk = (currentParentId: string) => {
    for (const item of plainItems) {
      if (item.parent !== currentParentId || result.has(item._id)) continue;

      result.add(item._id);
      walk(item._id);
    }
  };

  walk(parentId);
  return result;
}

export const categoryService = {
  async getAll() {
    return categoryRepository.findAllActive();
  },

  async getTree() {
    const items = await categoryRepository.findAllActive();
    return buildCategoryTree(items);
  },

  async getDeleted() {
    return categoryRepository.findAllDeleted();
  },

  async create(payload: CategoryPayload) {
    const slug = slugify(payload.name);
    const parent = await normalizeParent(payload.parent);

    const exists = await categoryRepository.findBySlug(slug);
    if (exists) {
      throw new Error("Danh mục đã tồn tại");
    }

    return categoryRepository.create({
      name: payload.name.trim(),
      slug,
      description: payload.description || "",
      parent,
      isActive: payload.isActive ?? true,
    });
  },

  async update(id: string, payload: CategoryUpdatePayload) {
    const item = await categoryRepository.findById(id);
    if (!item) {
      throw new Error("Không tìm thấy danh mục");
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      parent?: string | null;
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

    if (payload.parent !== undefined) {
      const parent = await normalizeParent(payload.parent);

      if (parent === id) {
        throw new Error("Danh mục không thể là cha của chính nó");
      }

      if (parent) {
        const allItems = await categoryRepository.findAllActive();
        const descendantIds = collectDescendantIds(allItems, id);

        if (descendantIds.has(parent)) {
          throw new Error("Không thể chuyển danh mục vào danh mục con của nó");
        }
      }

      updateData.parent = parent;
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

    const child = await categoryRepository.findActiveChild(id);
    if (child) {
      throw new Error("Danh mục đang có danh mục con, không thể xóa mềm");
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

    const child = await categoryRepository.findActiveChild(id);
    if (child) {
      throw new Error("Danh mục đang có danh mục con, không thể xóa cứng");
    }

    const deleted = await categoryRepository.forceDeleteById(id);
    if (!deleted) {
      throw new Error("Không tìm thấy danh mục");
    }

    return deleted;
  },
};
