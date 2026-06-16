import { Router } from "express";
import { upload } from "../../config/multer";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/auth/authGuard";
import { productController } from "./course.controller";
import {
  createProductSchema,
  getProductsQuerySchema,
  productIdSchema,
  updateProductSchema,
} from "./course.validation";

const router = Router();

router.get("/", validate(getProductsQuerySchema), productController.getAll);
router.get("/deleted", authGuard, productController.getDeleted);

router.get("/:id", validate(productIdSchema), productController.getById);

router.post(
  "/",
  authGuard,
  upload.single("image"),
  validate(createProductSchema),
  productController.create
);

router.put(
  "/:id",
  authGuard,
  upload.single("image"),
  validate(updateProductSchema),
  productController.update
);

router.patch(
  "/:id/restore",
  authGuard,
  validate(productIdSchema),
  productController.restore
);

router.delete(
  "/:id",
  authGuard,
  validate(productIdSchema),
  productController.softDelete
);

router.delete(
  "/:id/force",
  authGuard,
  validate(productIdSchema),
  productController.forceDelete
);

export default router;