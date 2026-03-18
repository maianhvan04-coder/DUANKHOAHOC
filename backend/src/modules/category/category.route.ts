import { Router } from "express";
import { categoryController } from "./category.controller";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/auth/authGuard";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "./category.validation";

const router = Router();

router.get("/", categoryController.getAll);
router.get("/deleted", authGuard, categoryController.getDeleted);

router.post("/", authGuard, validate(createCategorySchema), categoryController.create);
router.put("/:id", authGuard, validate(updateCategorySchema), categoryController.update);

// soft delete
router.delete("/:id", authGuard, validate(categoryIdSchema), categoryController.softDelete);

// restore
router.patch(
  "/:id/restore",
  authGuard,
  validate(categoryIdSchema),
  categoryController.restore
);

// force delete
router.delete(
  "/:id/force",
  authGuard,
  validate(categoryIdSchema),
  categoryController.forceDelete
);

export default router;