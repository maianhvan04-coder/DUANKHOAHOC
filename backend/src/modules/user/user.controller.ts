import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { userService } from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { z } from "zod";

type IdParams = { id: string };

const setActiveSchema = z.object({
  active: z.boolean(),
});

export const userController = {
  // GET /users?deleted=0|1
  list: asyncHandler(async (req: Request, res: Response) => {
    const deleted = String(req.query.deleted ?? "0") === "1";
    res.json(await userService.list(deleted));
  }),

  get: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = createUserSchema.parse(req.body);
    const user = await userService.create(payload);
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const payload = updateUserSchema.parse(req.body);
    const user = await userService.update(req.params.id, payload);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }),

  // ✅ PATCH /users/:id/active  (toggle ACTIVE/INACTIVE)
  setActive: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const body = setActiveSchema.parse(req.body);
    const user = await userService.setActive(req.params.id, body.active);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }),

  // DELETE /users/:id => soft delete (Users tab) => INACTIVE
  remove: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.softRemove(req.params.id);
    if (!ok) return res.status(404).json({ message: "User not found" });
    res.status(204).send();
  }),

  // DELETE /users/:id/hard => hard delete (Deleted tab)
  hardRemove: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.hardRemove(req.params.id);
    if (!ok) return res.status(404).json({ message: "User not found or not in Deleted" });
    res.status(204).send();
  }),

  // PATCH /users/:id/restore => restore + ACTIVE
  restore: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const ok = await userService.restore(req.params.id);
    if (!ok) return res.status(404).json({ message: "User not found or not deleted" });
    res.status(204).send();
  }),
};