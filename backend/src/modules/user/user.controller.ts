import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { userService } from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { PERMISSIONS } from "../../constants/permissions";
import { ROLES } from "../../constants/roles";

type IdParams = { id: string };

const setActiveSchema = z.object({
  active: z.boolean(),
});

export const userController = {
  // GET /users?deleted=0|1
  list: asyncHandler(async (req: Request, res: Response) => {
    const deleted = String(req.query.deleted ?? "0") === "1";
    const result = await userService.list(deleted, req.query);
    res.json(result);
  }),

  get: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const user = await userService.getById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = createUserSchema.parse(req.body);

    // nếu tạo user với role khác USER thì cần quyền gán role
    if (
      payload.role &&
      payload.role !== ROLES.USER &&
      !req.user?.permissions.includes(PERMISSIONS.USER_SET_ROLES)
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền gán vai trò cho người dùng",
      });
    }

    const user = await userService.create(payload);
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const payload = updateUserSchema.parse(req.body);

    // nếu update role thì cần quyền set role
    if (
      payload.role &&
      !req.user?.permissions.includes(PERMISSIONS.USER_SET_ROLES)
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền gán vai trò cho người dùng",
      });
    }

    const user = await userService.update(req.params.id, payload);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  }),

  setActive: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const body = setActiveSchema.parse(req.body);

    const user = await userService.setActive(req.params.id, body.active);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  }),

  remove: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.softRemove(req.params.id);

    if (!ok) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(204).send();
  }),

  hardRemove: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.hardRemove(req.params.id);

    if (!ok) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng hoặc người dùng chưa ở thùng rác",
      });
    }

    res.status(204).send();
  }),

  restore: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.restore(req.params.id);

    if (!ok) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng hoặc người dùng chưa bị xóa",
      });
    }

    res.status(204).send();
  }),
};
