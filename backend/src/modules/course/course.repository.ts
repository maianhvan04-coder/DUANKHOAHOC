import { isValidObjectId, Types } from "mongoose";
import { ProductModel, type Product, type ProductMode } from "./course.model";
import { escapeRegex, getQueryString, type ListQueryInput } from "../../utils/list-query";

type CreateProductRepoPayload = {
  title: string;
  slug: string;
  shortDescription: string;
  image: string;
  imagePublicId: string;
  category: Types.ObjectId;
  level: Product["level"];
  modes: ProductMode[];
  status: Product["status"];
  durationText: string;
  price: number;
  isActive?: boolean;
};

type UpdateProductRepoPayload = Partial<CreateProductRepoPayload>;

export const productRepository = {
  findAll(query: ListQueryInput & { categoryId?: string } = {}) {
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

    const keyword = getQueryString(query, ["q", "search", "keyword"]);
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      filter.$or = [
        { title: regex },
        { shortDescription: regex },
        { status: regex },
      ];
    }

    const status = getQueryString(query, ["status"]);
    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    return ProductModel.find(filter).populate("category").sort({ createdAt: -1 });
  },

  findAllDeleted(query: ListQueryInput = {}) {
    const filter: Record<string, unknown> = {
      isDeleted: true,
    };

    const categoryId = getQueryString(query, ["categoryId"]);
    if (categoryId && categoryId !== "ALL" && categoryId !== "all" && isValidObjectId(categoryId)) {
      filter.category = new Types.ObjectId(categoryId);
    }

    const keyword = getQueryString(query, ["q", "search", "keyword"]);
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      filter.$or = [
        { title: regex },
        { shortDescription: regex },
        { status: regex },
      ];
    }

    const status = getQueryString(query, ["status"]);
    if (status && status.toUpperCase() !== "ALL") {
      filter.status = status.toUpperCase();
    }

    return ProductModel.find(filter).populate("category").sort({ deletedAt: -1 });
  },

  findById(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: false,
    });
  },

  findDeletedById(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: true,
    });
  },

  findAnyById(id: string) {
    return ProductModel.findById(id);
  },

  findByIdWithCategory(id: string) {
    return ProductModel.findOne({
      _id: id,
      isDeleted: false,
    }).populate("category");
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
    ).populate("category");
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
    );
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
    ).populate("category");
  },

  forceDeleteById(id: string) {
    return ProductModel.findByIdAndDelete(id);
  },
};
