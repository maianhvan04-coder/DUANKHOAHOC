import { CategoryModel } from "./category.model";

export const categoryRepository = {
  findAllActive() {
    return CategoryModel.find({
      isDeleted: false,
    }).sort({ createdAt: -1 });
  },

  findAllDeleted() {
    return CategoryModel.find({
      isDeleted: true,
    }).sort({ deletedAt: -1 });
  },

  findById(id: string) {
    return CategoryModel.findOne({
      _id: id,
      isDeleted: false,
    });
  },

  findActiveChild(parentId: string) {
    return CategoryModel.findOne({
      parent: parentId,
      isDeleted: false,
    });
  },

  findDeletedById(id: string) {
    return CategoryModel.findOne({
      _id: id,
      isDeleted: true,
    });
  },

  findAnyById(id: string) {
    return CategoryModel.findById(id);
  },

  findBySlug(slug: string) {
    return CategoryModel.findOne({
      slug,
      isDeleted: false,
    });
  },

  findBySlugExcludeId(slug: string, id: string) {
    return CategoryModel.findOne({
      slug,
      isDeleted: false,
      _id: { $ne: id },
    });
  },

  create(payload: {
    name: string;
    slug: string;
    description?: string;
    parent?: string | null;
    isActive?: boolean;
  }) {
    return CategoryModel.create(payload);
  },

  updateById(
    id: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      parent?: string | null;
      isActive?: boolean;
    }
  ) {
    return CategoryModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: payload,
      },
      {
        new: true,
      }
    );
  },

  softDeleteById(id: string) {
    return CategoryModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );
  },

  restoreById(id: string) {
    return CategoryModel.findOneAndUpdate(
      {
        _id: id,
        isDeleted: true,
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      {
        new: true,
      }
    );
  },

  forceDeleteById(id: string) {
    return CategoryModel.findByIdAndDelete(id);
  },
};
