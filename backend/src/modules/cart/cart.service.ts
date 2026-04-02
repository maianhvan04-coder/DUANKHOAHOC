import { Types } from "mongoose";
import { ProductModel } from "../course/course.model";
import * as cartRepository from "./cart.repository";

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CourseLean = {
  _id: Types.ObjectId;
  title?: string;
  slug?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  status?: string;
  isActive?: boolean;
  isDeleted?: boolean;
};

type CartResponseItem = {
  courseId: Types.ObjectId | string;
  title: string;
  image: string;
  quantity: number;
  selected: boolean;
  unitPrice: number;
  originalPrice: number;
  subtotal: number;
  originalSubtotal: number;
  discountSubtotal: number;
  isAvailable: boolean;
  course: null | {
    _id: Types.ObjectId | string;
    title?: string;
    slug?: string;
    image?: string;
    price?: number;
    originalPrice?: number;
    status?: string;
    isActive?: boolean;
  };
};

async function findAvailableCourse(courseId: string | Types.ObjectId) {
  const normalizedCourseId = cartRepository.toObjectId(courseId);

  const course = await ProductModel.findOne({
    _id: normalizedCourseId,
    isDeleted: { $ne: true },
    isActive: true,
  })
    .select("title slug price originalPrice image status isActive isDeleted")
    .lean<CourseLean>();

  if (!course) {
    throw new AppError("Khóa học không tồn tại hoặc đã ngừng bán", 404);
  }

  return course;
}

function mapCartResponse(cart: any) {
  const items: CartResponseItem[] = (cart.items || []).map((item: any) => {
    const course =
      item.course &&
      typeof item.course === "object" &&
      "_id" in item.course
        ? (item.course as CourseLean)
        : null;

    const courseId = course?._id || item.course;
    const title = course?.title || item.titleSnapshot || "";
    const image = course?.image || item.imageSnapshot || "";
    const livePrice = Number(course?.price ?? item.unitPrice ?? 0);
    const liveOriginalPrice = Number(
      course?.originalPrice ?? item.originalPrice ?? livePrice
    );

    const quantity = Number(item.quantity || 1);
    const subtotal = livePrice * quantity;
    const originalSubtotal = liveOriginalPrice * quantity;
    const discountSubtotal = Math.max(originalSubtotal - subtotal, 0);

    const isAvailable =
      !!course && course.isActive !== false && course.isDeleted !== true;

    return {
      courseId,
      title,
      image,
      quantity,
      selected: !!item.selected,
      unitPrice: livePrice,
      originalPrice: liveOriginalPrice,
      subtotal,
      originalSubtotal,
      discountSubtotal,
      isAvailable,
      course: course
        ? {
            _id: course._id,
            title: course.title,
            slug: course.slug,
            image: course.image,
            price: course.price,
            originalPrice: course.originalPrice,
            status: course.status,
            isActive: course.isActive,
          }
        : null,
    };
  });

  const selectedItems = items.filter((item) => item.selected && item.isAvailable);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalOriginalPrice = selectedItems.reduce(
    (sum, item) => sum + item.originalSubtotal,
    0
  );
  const totalDiscount = Math.max(totalOriginalPrice - totalPrice, 0);

  return {
    _id: cart._id,
    user: cart.user,
    items,
    summary: {
      totalItems,
      selectedCount,
      totalPrice,
      totalOriginalPrice,
      totalDiscount,
    },
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export async function getMyCart(userId: string | Types.ObjectId) {
  const cart = await cartRepository.getOrCreateByUserId(userId);
  await cartRepository.populateCart(cart);
  return mapCartResponse(cart);
}

export async function addItem(
  userId: string | Types.ObjectId,
  courseId: string,
  quantity = 1
) {
  const course = await findAvailableCourse(courseId);
  const cart = await cartRepository.getOrCreateByUserId(userId);

  const index = cartRepository.findItemIndex(cart, courseId);

  if (index >= 0) {
    cart.items[index].quantity += Number(quantity);
    cart.items[index].unitPrice = Number(course.price || 0);
    cart.items[index].originalPrice = Number(
      course.originalPrice ?? course.price ?? 0
    );
    cart.items[index].titleSnapshot = course.title || "";
    cart.items[index].imageSnapshot = course.image || "";
  } else {
    cart.items.push({
      course: course._id,
      quantity: Number(quantity),
      unitPrice: Number(course.price || 0),
      originalPrice: Number(course.originalPrice ?? course.price ?? 0),
      titleSnapshot: course.title || "",
      imageSnapshot: course.image || "",
      selected: true,
    } as any);
  }

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}

export async function updateItemQuantity(
  userId: string | Types.ObjectId,
  courseId: string,
  quantity: number
) {
  const cart = await cartRepository.getOrCreateByUserId(userId);
  const index = cartRepository.findItemIndex(cart, courseId);

  if (index < 0) {
    throw new AppError("Sản phẩm không có trong giỏ hàng", 404);
  }

  const course = await findAvailableCourse(courseId);

  cart.items[index].quantity = Number(quantity);
  cart.items[index].unitPrice = Number(course.price || 0);
  cart.items[index].originalPrice = Number(
    course.originalPrice ?? course.price ?? 0
  );
  cart.items[index].titleSnapshot = course.title || "";
  cart.items[index].imageSnapshot = course.image || "";

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}

export async function toggleItemSelected(
  userId: string | Types.ObjectId,
  courseId: string,
  selected: boolean
) {
  const cart = await cartRepository.getOrCreateByUserId(userId);
  const index = cartRepository.findItemIndex(cart, courseId);

  if (index < 0) {
    throw new AppError("Sản phẩm không có trong giỏ hàng", 404);
  }

  cart.items[index].selected = !!selected;

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}

export async function selectAllItems(
  userId: string | Types.ObjectId,
  selected: boolean
) {
  const cart = await cartRepository.getOrCreateByUserId(userId);

  cartRepository.setAllItemsSelected(cart, selected);

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}

export async function removeItem(
  userId: string | Types.ObjectId,
  courseId: string
) {
  const cart = await cartRepository.getOrCreateByUserId(userId);

  const { removed } = cartRepository.removeItemByCourseId(cart, courseId);

  if (!removed) {
    throw new AppError("Sản phẩm không có trong giỏ hàng", 404);
  }

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}

export async function clearCart(userId: string | Types.ObjectId) {
  const cart = await cartRepository.getOrCreateByUserId(userId);

  cart.items.splice(0, cart.items.length);

  await cartRepository.saveCart(cart);
  await cartRepository.populateCart(cart);

  return mapCartResponse(cart);
}