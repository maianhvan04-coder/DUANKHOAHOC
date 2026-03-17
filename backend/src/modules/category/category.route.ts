import { Router } from "express";
import { categoryController } from "./category.controller";
import { validate } from "../../middlewares/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "./category.validation";

const router = Router();

router.get("/", categoryController.getAll);
router.get("/deleted", categoryController.getDeleted);

router.post("/", validate(createCategorySchema), categoryController.create);
router.put("/:id", validate(updateCategorySchema), categoryController.update);

// soft delete
router.delete("/:id", validate(categoryIdSchema), categoryController.softDelete);

// restore
router.patch(
  "/:id/restore",
  validate(categoryIdSchema),
  categoryController.restore
);

// force delete
router.delete(
  "/:id/force",
  validate(categoryIdSchema),
  categoryController.forceDelete
);

export default router;