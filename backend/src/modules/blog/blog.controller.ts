import { Request, Response } from "express";
import { blogService } from "./blog.service";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary-upload";

type BlogParams = {
  id: string;
};

type BlogQuery = {
  category?: string;
  featured?: string;
  isFeatured?: string;
  isPublished?: string;
  keyword?: string;
  limit?: string;
  page?: string;
  published?: string;
  q?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

type BlogBody = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[] | string;
  authorName?: string;
  isFeatured?: boolean | "true" | "false";
  isPublished?: boolean | "true" | "false";
  publishedAt?: string;
};

function hasData(value: unknown) {
  return (
    !!value &&
    typeof value === "object" &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

function getStatusByMessage(message: string, notFoundMessage: string) {
  return message === notFoundMessage ? 404 : 400;
}

export const blogController = {
  async getAll(
    req: Request<Record<string, never>, unknown, unknown, BlogQuery>,
    res: Response
  ) {
    try {
      const result = await blogService.getAll(req.query, { publicOnly: true });
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getAdminAll(
    req: Request<Record<string, never>, unknown, unknown, BlogQuery>,
    res: Response
  ) {
    try {
      const result = await blogService.getAll(req.query, { publicOnly: false });
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(req: Request, res: Response) {
    try {
      const result = await blogService.getDeleted(req.query);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getById(req: Request<BlogParams>, res: Response) {
    try {
      const item = await blogService.getPublishedByIdOrSlug(req.params.id);
      return res.json({ item });
    } catch (error: any) {
      const status = getStatusByMessage(error.message, "Không tìm thấy bài viết");
      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async create(
    req: Request<Record<string, never>, unknown, BlogBody>,
    res: Response
  ) {
    try {
      let imageData:
        | {
            image: string;
            imagePublicId: string;
          }
        | undefined;

      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "blogs");
        imageData = {
          image: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }

      const item = await blogService.create(
        req.body as Required<Pick<BlogBody, "title" | "content" | "category">> &
          BlogBody,
        imageData,
        req.user
      );

      return res.status(201).json({ item });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Create failed",
      });
    }
  },

  async update(req: Request<BlogParams, unknown, BlogBody>, res: Response) {
    try {
      const hasBody = hasData(req.body);
      const hasImage = !!req.file;

      if (!hasBody && !hasImage) {
        return res.status(400).json({
          message: "Không có dữ liệu cập nhật",
        });
      }

      let imageData:
        | {
            image: string;
            imagePublicId: string;
          }
        | undefined;
      let oldImagePublicId = "";

      if (req.file) {
        const current = await blogService.getById(req.params.id);
        oldImagePublicId = current.imagePublicId || "";

        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "blogs");
        imageData = {
          image: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }

      const item = await blogService.update(req.params.id, req.body, imageData);

      if (oldImagePublicId && imageData?.imagePublicId !== oldImagePublicId) {
        try {
          await deleteFromCloudinary(oldImagePublicId);
        } catch (error) {
          console.error("Delete old blog image failed:", error);
        }
      }

      return res.json({ item });
    } catch (error: any) {
      const status = getStatusByMessage(error.message, "Không tìm thấy bài viết");
      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<BlogParams>, res: Response) {
    try {
      await blogService.softDelete(req.params.id);
      return res.json({ message: "Xóa mềm bài viết thành công" });
    } catch (error: any) {
      const status = getStatusByMessage(error.message, "Không tìm thấy bài viết");
      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<BlogParams>, res: Response) {
    try {
      const item = await blogService.restore(req.params.id);
      return res.json({
        message: "Khôi phục bài viết thành công",
        item,
      });
    } catch (error: any) {
      const status = getStatusByMessage(
        error.message,
        "Không tìm thấy bài viết đã xóa"
      );
      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<BlogParams>, res: Response) {
    try {
      const deleted = await blogService.forceDelete(req.params.id);

      if (deleted.imagePublicId) {
        try {
          await deleteFromCloudinary(deleted.imagePublicId);
        } catch (error) {
          console.error("Delete blog image failed:", error);
        }
      }

      return res.json({ message: "Xóa cứng bài viết thành công" });
    } catch (error: any) {
      const status = getStatusByMessage(error.message, "Không tìm thấy bài viết");
      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};
