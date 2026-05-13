import { Request, Response } from "express";
import { categoryService } from "./category.service";

type CategoryParams = {
  id: string;
};

type CreateCategoryBody = {
  name: string;
  description?: string;
  isActive?: boolean;
};

type UpdateCategoryBody = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export const categoryController = {
  async getAll(_req: Request, res: Response) {
    try {
      const items = await categoryService.getAll();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(_req: Request, res: Response) {
    try {
      const items = await categoryService.getDeleted();
      return res.json({ items });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async create(
    req: Request<Record<string, never>, unknown, CreateCategoryBody>,
    res: Response
  ) {
    try {
      const item = await categoryService.create(req.body);
      return res.status(201).json({ item });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Create failed",
      });
    }
  },

  async update(
    req: Request<CategoryParams, unknown, UpdateCategoryBody>,
    res: Response
  ) {
    try {
      const item = await categoryService.update(req.params.id, req.body);
      return res.json({ item });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy danh mục" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<CategoryParams>, res: Response) {
    try {
      await categoryService.softDelete(req.params.id);
      return res.json({ message: "Xóa mềm danh mục thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy danh mục" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<CategoryParams>, res: Response) {
    try {
      const item = await categoryService.restore(req.params.id);
      return res.json({
        message: "Khôi phục danh mục thành công",
        item,
      });
    } catch (error: any) {
      const status =
        error.message === "Không tìm thấy danh mục đã xóa" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<CategoryParams>, res: Response) {
    try {
      await categoryService.forceDelete(req.params.id);
      return res.json({ message: "Xóa cứng danh mục thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy danh mục" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};
