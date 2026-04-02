import { HydratedDocument, Types } from "mongoose";
import Cart, { ICart } from "./cart.model";

export type CartDocument = HydratedDocument<ICart>;

const CART_POPULATE = {
  path: "items.course",
  select: "title slug price originalPrice image status isActive isDeleted",
};

export function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;

  if (!Types.ObjectId.isValid(value)) {
    throw new Error("ID không hợp lệ");
  }

  return new Types.ObjectId(value);
}

export async function findByUserId(
  userId: string | Types.ObjectId
): Promise<CartDocument | null> {
  return Cart.findOne({ user: toObjectId(userId) });
}

export async function createForUser(
  userId: string | Types.ObjectId
): Promise<CartDocument> {
  return Cart.create({
    user: toObjectId(userId),
    items: [],
  });
}

export async function getOrCreateByUserId(
  userId: string | Types.ObjectId
): Promise<CartDocument> {
  let cart = await findByUserId(userId);

  if (!cart) {
    cart = await createForUser(userId);
  }

  return cart;
}

export async function populateCart(cart: CartDocument): Promise<CartDocument> {
  await cart.populate(CART_POPULATE);
  return cart;
}

export async function saveCart(cart: CartDocument): Promise<CartDocument> {
  await cart.save();
  return cart;
}

export function getItemCourseId(item: any): string {
  if (!item?.course) return "";

  if (typeof item.course === "string") return item.course;
  if (item.course instanceof Types.ObjectId) return item.course.toString();
  if (item.course?._id) return item.course._id.toString();

  return String(item.course);
}

export function findItemIndex(
  cart: CartDocument,
  courseId: string | Types.ObjectId
): number {
  const normalizedCourseId =
    courseId instanceof Types.ObjectId ? courseId.toString() : courseId;

  return cart.items.findIndex((item: any) => {
    return getItemCourseId(item) === normalizedCourseId;
  });
}

export function setAllItemsSelected(
  cart: CartDocument,
  selected: boolean
): CartDocument {
  cart.items.forEach((item: any) => {
    item.selected = !!selected;
  });

  return cart;
}

export function removeItemByCourseId(
  cart: CartDocument,
  courseId: string | Types.ObjectId
): { cart: CartDocument; removed: boolean } {
  const normalizedCourseId =
    courseId instanceof Types.ObjectId ? courseId.toString() : courseId;

  const before = cart.items.length;

  const nextItems = cart.items.filter((item: any) => {
    return getItemCourseId(item) !== normalizedCourseId;
  });

  cart.items.splice(0, cart.items.length, ...(nextItems as any));

  return {
    cart,
    removed: cart.items.length < before,
  };
}