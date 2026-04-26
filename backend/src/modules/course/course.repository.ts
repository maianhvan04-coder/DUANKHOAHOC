import { isValidObjectId, Types } from "mongoose";
import { ProductModel, type Product, type ProductMode } from "./course.model";

type CreateProductRepoPayload = {
  title: string;
  slug: string;
  shortDescription: string;
  teacher?: Types.ObjectId | null;
  teacherName: string;
  image: string;
  imagePublicId: string;
  category: Types.ObjectId;
  level: Product["level"];
  modes: ProductMode[];
  status: Product["status"];
  rating: number;
  durationText: string;
  price: number;
  isActive?: boolean;
};

type UpdateProductRepoPayload = Partial<CreateProductRepoPayload>;

const teacherPopulate = {
  path: "teacher",
  select: "user specialty avatar degree experience rating",
  populate: {
    path: "user",
    select: "name email",
  },
};

export const productRepository = {
  findAll(query: { categoryId?: string; limit?: string | number }) {
    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (
      query.categoryId &&
      query.categoryId !== "all" &&
      isValidObjectId(query.categoryId)
    ) {
      filter.category = new Types.ObjectId(query.categoryId);
    }

    let mongoQuery = ProductModel.find(filter)
      .populate("category")
      .populate(teacherPopulate)
      .sort({ createdAt: -1 });

    if (query.limit) {
      mongoQuery = mongoQuery.limit(Number(query.limit));
    }

    return mongoQuery;
  },

  findAllDeleted() {
    return ProductModel.find({
      isDeleted: true,
    })
      .populate("category")
      .populate(teacherPopulate)
      .sort({ deletedAt: -1 });
  },

  findById(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: false,
    }).populate(teacherPopulate);
  },

  findDeletedById(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: true,
    }).populate(teacherPopulate);
  },

  findAnyById(id: string) {
    return ProductModel.findById(id).populate(teacherPopulate);
  },

  findByIdWithCategory(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("category")
      .populate(teacherPopulate);
  },

  findBySlug(slug: string) {
    return ProductModel.findOne({
      slug,
      isDeleted: false,
    });
  },

  findBySlugExcludeId(slug: string, id: string) {
    return ProductModel.findOne({
      slug,
      isDeleted: false,
      _id: { $ne: id },
    });
  },

  create(payload: CreateProductRepoPayload) {
    return ProductModel.create(payload);
  },

  updateById(id: string, payload: UpdateProductRepoPayload) {
    return ProductModel.findOneAndUpdate(
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
    )
      .populate("category")
      .populate(teacherPopulate);
  },

  softDeleteById(id: string) {
    return ProductModel.findOneAndUpdate(
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
    ).populate(teacherPopulate);
  },

  restoreById(id: string) {
    return ProductModel.findOneAndUpdate(
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
    )
      .populate("category")
      .populate(teacherPopulate);
  },

  forceDeleteById(id: string) {
    return ProductModel.findByIdAndDelete(id).populate(teacherPopulate);
  },
};