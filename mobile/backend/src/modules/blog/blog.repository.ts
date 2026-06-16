import { isValidObjectId, Types } from "mongoose";
import { BlogModel, type Blog } from "./blog.model";
import {
  escapeRegex,
  getQueryString,
  type ListQueryInput,
} from "../../utils/list-query";

type BlogRepoPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  image: string;
  imagePublicId: string;
  authorName: string;
  createdBy?: Types.ObjectId | null;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
};

type FindAllOptions = {
  publicOnly?: boolean;
};

type UpdateBlogRepoPayload = Partial<BlogRepoPayload> & {
  deletedAt?: Date | null;
  isDeleted?: boolean;
};

function buildListFilter(query: ListQueryInput, options: FindAllOptions = {}) {
  const filter: Record<string, unknown> = {
    isDeleted: false,
  };

  if (options.publicOnly) {
    filter.isPublished = true;
  }

  const category = getQueryString(query, ["category"]);
  if (category && category.toLowerCase() !== "all") {
    filter.category = category;
  }

  const isFeatured = getQueryString(query, ["isFeatured", "featured"]);
  if (isFeatured) {
    filter.isFeatured = isFeatured === "true";
  }

  const isPublished = getQueryString(query, ["isPublished", "published"]);
  if (!options.publicOnly && isPublished) {
    filter.isPublished = isPublished === "true";
  }

  const keyword = getQueryString(query, ["q", "search", "keyword"]);
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [
      { title: regex },
      { excerpt: regex },
      { content: regex },
      { category: regex },
      { tags: regex },
      { authorName: regex },
    ];
  }

  return filter;
}

export const blogRepository = {
  findAll(query: ListQueryInput = {}, options: FindAllOptions = {}) {
    return BlogModel.find(buildListFilter(query, options))
      .populate("createdBy", "name email")
      .sort({ publishedAt: -1, createdAt: -1 });
  },

  findAllDeleted(query: ListQueryInput = {}) {
    const filter: Record<string, unknown> = {
      isDeleted: true,
    };

    const keyword = getQueryString(query, ["q", "search", "keyword"]);
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { content: regex },
        { category: regex },
        { tags: regex },
        { authorName: regex },
      ];
    }

    return BlogModel.find(filter)
      .populate("createdBy", "name email")
      .sort({ deletedAt: -1 });
  },

  findById(id: string) {
    if (!isValidObjectId(id)) return null;

    return BlogModel.findOne({
      _id: id,
      isDeleted: false,
    }).populate("createdBy", "name email");
  },

  findPublishedByIdOrSlug(value: string) {
    const filter = isValidObjectId(value)
      ? { _id: value, isDeleted: false, isPublished: true }
      : { slug: value, isDeleted: false, isPublished: true };

    return BlogModel.findOne(filter).populate("createdBy", "name email");
  },

  findDeletedById(id: string) {
    if (!isValidObjectId(id)) return null;

    return BlogModel.findOne({
      _id: id,
      isDeleted: true,
    }).populate("createdBy", "name email");
  },

  findAnyById(id: string) {
    if (!isValidObjectId(id)) return null;

    return BlogModel.findById(id).populate("createdBy", "name email");
  },

  findBySlug(slug: string) {
    return BlogModel.findOne({
      slug,
      isDeleted: false,
    });
  },

  findBySlugExcludeId(slug: string, id: string) {
    return BlogModel.findOne({
      slug,
      isDeleted: false,
      _id: { $ne: id },
    });
  },

  create(payload: BlogRepoPayload) {
    return BlogModel.create(payload);
  },

  updateById(id: string, payload: UpdateBlogRepoPayload) {
    return BlogModel.findOneAndUpdate(
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
    ).populate("createdBy", "name email");
  },

  softDeleteById(id: string) {
    return BlogModel.findOneAndUpdate(
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
    ).populate("createdBy", "name email");
  },

  restoreById(id: string) {
    return BlogModel.findOneAndUpdate(
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
    ).populate("createdBy", "name email");
  },

  forceDeleteById(id: string) {
    return BlogModel.findByIdAndDelete(id).populate("createdBy", "name email");
  },
};

export type BlogDocument = Blog;
