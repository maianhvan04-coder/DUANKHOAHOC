import { Router } from "express";
import * as cartController from "./cart.controller";
import {
  addItemSchema,
  removeItemSchema,
  selectAllItemsSchema,
  toggleItemSelectedSchema,
  updateItemQuantitySchema,
} from "./cart.validation";
import { authGuard } from "../../middlewares/auth/authGuard";
import { validate } from "../../middlewares/validate";

const router = Router();

router.use(authGuard);

router.get("/", cartController.getMyCart);

router.post("/items", validate(addItemSchema), cartController.addItem);

router.patch(
  "/items/:courseId",
  validate(updateItemQuantitySchema),
  cartController.updateItemQuantity
);

router.patch(
  "/items/:courseId/select",
  validate(toggleItemSelectedSchema),
  cartController.toggleItemSelected
);

router.patch(
  "/select-all",
  validate(selectAllItemsSchema),
  cartController.selectAllItems
);

router.delete(
  "/items/:courseId",
  validate(removeItemSchema),
  cartController.removeItem
);

router.delete("/", cartController.clearCart);

export default router;