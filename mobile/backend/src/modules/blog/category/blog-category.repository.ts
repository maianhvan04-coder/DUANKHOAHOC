import { BlogCategoryModel } from "./blog-category.model";

type BlogCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
};

export const blogCategoryRepository = {
  findAllActive() {
    return BlogCategoryModel.find({
      isDeleted: false,
      isActive: true,
    }).sort({ createdAt: -1 });
  },

  findAllAdmin() {
    return BlogCategoryModel.find({
      isDeleted: false,
    }).sort({ createdAt: -1 });
  },

  findAllDeleted() {
    return BlogCategoryModel.find({
      isDeleted: true,
    }).sort({ deletedAt: -1 });
  },

  findById(id: string) {
    return BlogCategoryModel.findOne({
      _id: id,
      isDeleted: false,
    });
  },

  findDeletedById(id: string) {
    return BlogCategoryModel.findOne({
      _id: id,
      isDeleted: true,
    });
  },

  findAnyById(id: string) {
    return BlogCategoryModel.findById(id);
  },

  findByName(name: string) {
    return BlogCategoryModel.findOne({
      name,
      isDeleted: false,
      isActive: true,
    });
  },

  findBySlug(slug: string) {
    return BlogCategoryModel.findOne({
      slug,
      isDeleted: false,
    });
  },

  findBySlugExcludeId(slug: string, id: string) {
    return BlogCategoryModel.findOne({
      slug,
      isDeleted: false,
      _id: { $ne: id },
    });
  },

  create(payload: BlogCategoryPayload) {
    return BlogCategoryModel.create(payload);
  },

  updateById(id: string, payload: Partial<BlogCategoryPayload>) {
    return BlogCategoryModel.findOneAndUpdate(
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
    return BlogCategoryModel.findOneAndUpdate(
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
    return BlogCategoryModel.findOneAndUpdate(
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
    return BlogCategoryModel.findByIdAndDelete(id);
  },
};
