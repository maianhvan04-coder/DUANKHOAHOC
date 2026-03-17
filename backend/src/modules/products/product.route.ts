import { Router } from "express";
import { upload } from "../../config/multer";
import { validate } from "../../middlewares/validate";
import { productController } from "./product.controller";
import {
  createProductSchema,
  getProductsQuerySchema,
  productIdSchema,
  updateProductSchema,
} from "./product.validation";

const router = Router();

router.get("/", validate(getProductsQuerySchema), productController.getAll);
router.get("/deleted", productController.getDeleted);

router.get("/:id", validate(productIdSchema), productController.getById);
router.post(
  "/",
  upload.single("image"),
  validate(createProductSchema),
  productController.create
);
router.put(
  "/:id",
  upload.single("image"),
  validate(updateProductSchema),
  productController.update
);

router.patch(
  "/:id/restore",
  validate(productIdSchema),
  productController.restore
);

router.delete("/:id", validate(productIdSchema), productController.softDelete);

router.delete(
  "/:id/force",
  validate(productIdSchema),
  productController.forceDelete
);

export default router;