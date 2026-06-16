import { Request, Response } from "express";
import { blogCategoryService } from "./blog-category.service";

type BlogCategoryParams = {
  id: string;
};

type BlogCategoryBody = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

function getStatusByMessage(message: string, notFoundMessage: string) {
  return message === notFoundMessage ? 404 : 400;
}

export const blogCategoryController = {
  async getAll(_req: Request, res: Response) {
    try {
      const items = await blogCategoryService.getAll();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getAdminAll(_req: Request, res: Response) {
    try {
      const items = await blogCategoryService.getAdminAll();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(_req: Request, res: Response) {
    try {
      const items = await blogCategoryService.getDeleted();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async create(
    req: Request<Record<string, never>, unknown, Required<Pick<BlogCategoryBody, "name">> & BlogCategoryBody>,
    res: Response
  ) {
    try {
      const item = await blogCategoryService.create(req.body);
      return res.status(201).json({ item });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Create failed",
      });
    }
  },

  async update(
    req: Request<BlogCategoryParams, unknown, BlogCategoryBody>,
    res: Response
  ) {
    try {
      const item = await blogCategoryService.update(req.params.id, req.body);
      return res.json({ item });
    } catch (error: any) {
      const status = getStatusByMessage(
        error.message,
        "Không tìm thấy chuyên mục blog"
      );
      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<BlogCategoryParams>, res: Response) {
    try {
      await blogCategoryService.softDelete(req.params.id);
      return res.json({ message: "Xóa mềm chuyên mục blog thành công" });
    } catch (error: any) {
      const status = getStatusByMessage(
        error.message,
        "Không tìm thấy chuyên mục blog"
      );
      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<BlogCategoryParams>, res: Response) {
    try {
      const item = await blogCategoryService.restore(req.params.id);
      return res.json({
        message: "Khôi phục chuyên mục blog thành công",
        item,
      });
    } catch (error: any) {
      const status = getStatusByMessage(
        error.message,
        "Không tìm thấy chuyên mục blog đã xóa"
      );
      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<BlogCategoryParams>, res: Response) {
    try {
      await blogCategoryService.forceDelete(req.params.id);
      return res.json({ message: "Xóa cứng chuyên mục blog thành công" });
    } catch (error: any) {
      const status = getStatusByMessage(
        error.message,
        "Không tìm thấy chuyên mục blog"
      );
      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};
