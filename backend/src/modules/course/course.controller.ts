import { Request, Response } from "express";
import { productService } from "./course.service";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../utils/cloudinary-upload";

type ProductParams = {
  id: string;
};

type ProductQuery = {
  categoryId?: string;
  limit?: string;
  page?: string;
  q?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
};

type ProductBody = {
  title?: string;
  shortDescription?: string;
  category?: string;
  level?: "Cơ bản" | "Trung cấp" | "Nâng cao";
  status?: "OPEN" | "COMING" | "FULL";
  durationText?: string;
  price?: string;
  isActive?: boolean | "true" | "false";
  modes?: "ONLINE" | "OFFLINE" | Array<"ONLINE" | "OFFLINE">;
};

function hasData(value: unknown) {
  return (
    !!value &&
    typeof value === "object" &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

export const productController = {
  async getAll(
    req: Request<Record<string, never>, unknown, unknown, ProductQuery>,
    res: Response
  ) {
    try {
      const result = await productService.getAll(req.query);
      return res.json(result);
    } catch (error: any) {
      console.error("GET /api/products error:", error);
      console.error("STACK:", error?.stack);
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getDeleted(req: Request, res: Response) {
    try {
      const result = await productService.getDeleted(req.query);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Server error",
      });
    }
  },

  async getById(req: Request<ProductParams>, res: Response) {
    try {
      const item = await productService.getById(req.params.id);
      return res.json({ item });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy khóa học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Get failed",
      });
    }
  },

  async create(
    req: Request<Record<string, never>, unknown, ProductBody>,
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
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "products");
        imageData = {
          image: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }

      const item = await productService.create(
        req.body as Required<Pick<ProductBody, "title" | "category" | "price">> &
          ProductBody,
        imageData
      );

      return res.status(201).json({ item });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Create failed",
      });
    }
  },

  async update(
    req: Request<ProductParams, unknown, ProductBody>,
    res: Response
  ) {
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
        const current = await productService.getById(req.params.id);
        oldImagePublicId = current.imagePublicId || "";

        const uploaded = await uploadBufferToCloudinary(req.file.buffer, "products");
        imageData = {
          image: uploaded.secure_url,
          imagePublicId: uploaded.public_id,
        };
      }

      const item = await productService.update(req.params.id, req.body, imageData);

      if (oldImagePublicId && imageData?.imagePublicId !== oldImagePublicId) {
        try {
          await deleteFromCloudinary(oldImagePublicId);
        } catch (error) {
          console.error("Delete old Cloudinary image failed:", error);
        }
      }

      return res.json({ item });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy khóa học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Update failed",
      });
    }
  },

  async softDelete(req: Request<ProductParams>, res: Response) {
    try {
      await productService.softDelete(req.params.id);
      return res.json({ message: "Xóa mềm khóa học thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy khóa học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Soft delete failed",
      });
    }
  },

  async restore(req: Request<ProductParams>, res: Response) {
    try {
      const item = await productService.restore(req.params.id);
      return res.json({
        message: "Khôi phục khóa học thành công",
        item,
      });
    } catch (error: any) {
      const status =
        error.message === "Không tìm thấy khóa học đã xóa" ? 404 : 400;

      return res.status(status).json({
        message: error.message || "Restore failed",
      });
    }
  },

  async forceDelete(req: Request<ProductParams>, res: Response) {
    try {
      const deleted = await productService.forceDelete(req.params.id);

      if (deleted.imagePublicId) {
        try {
          await deleteFromCloudinary(deleted.imagePublicId);
        } catch (error) {
          console.error("Delete Cloudinary image failed:", error);
        }
      }

      return res.json({ message: "Xóa cứng khóa học thành công" });
    } catch (error: any) {
      const status = error.message === "Không tìm thấy khóa học" ? 404 : 400;
      return res.status(status).json({
        message: error.message || "Force delete failed",
      });
    }
  },
};
