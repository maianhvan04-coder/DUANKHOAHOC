import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { teacherService } from "./teacher.service";

export const teacherController = {
  listAdmin: asyncHandler(async (req: Request, res: Response) => {
    const q = String(req.query.q || "").trim();

    const deletedRaw = String(req.query.deleted || "").trim().toLowerCase();
    const deleted = deletedRaw === "true" || deletedRaw === "1";

    const items = await teacherService.list({ q, deleted });
    res.json(items);
  }),

  listPublic: asyncHandler(async (req: Request, res: Response) => {
    const q = String(req.query.q || "").trim();
    const items = await teacherService.listPublic({ q });
    res.json(items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const item = await teacherService.getById(id);

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    res.json(item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await teacherService.create(req.body, req.file);

    res.status(201).json({
      message: "Tạo giảng viên thành công",
      teacher: item,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const item = await teacherService.update(id, req.body, req.file);

    res.json({
      message: "Cập nhật giảng viên thành công",
      teacher: item,
    });
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const active =
      req.body.active === true ||
      req.body.active === "true" ||
      req.body.active === 1 ||
      req.body.active === "1";

    const item = await teacherService.setActive(id, active);

    res.json({
      message: "Cập nhật trạng thái giảng viên thành công",
      teacher: item,
    });
  }),

  softDelete: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const item = await teacherService.softDelete(id);

    res.json({
      message: "Xóa mềm giảng viên thành công",
      teacher: item,
    });
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    const item = await teacherService.restore(id);

    res.json({
      message: "Khôi phục giảng viên thành công",
      teacher: item,
    });
  }),

  hardDelete: asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id || "").trim();
    await teacherService.hardDelete(id);

    res.json({
      message: "Xóa cứng giảng viên thành công",
      id,
    });
  }),
};