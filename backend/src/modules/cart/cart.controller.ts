import { Request, Response } from "express";
import { Types } from "mongoose";
import * as cartService from "./cart.service";

type AuthUser = {
  _id?: string | Types.ObjectId;
  id?: string | Types.ObjectId;
  userId?: string | Types.ObjectId;
};

type AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = Request<P, ResBody, ReqBody, ReqQuery> & {
  user?: AuthUser;
  auth?: {
    userId?: string | Types.ObjectId;
  };
};

type CourseIdParams = {
  courseId: string;
};

type AddItemBody = {
  courseId: string;
  quantity: number;
};

type UpdateItemQuantityBody = {
  quantity: number;
};

type ToggleItemSelectedBody = {
  selected: boolean;
};

type SelectAllItemsBody = {
  selected: boolean;
};

function getUserIdFromRequest(req: AuthenticatedRequest): string | Types.ObjectId {
  const userId =
    req.user?._id || req.user?.id || req.user?.userId || req.auth?.userId;

  if (!userId) {
    const error: any = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  return userId;
}

function sendError(res: Response, error: any) {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Server error",
  });
}

export async function getMyCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = getUserIdFromRequest(req);
    const data = await cartService.getMyCart(userId);

    return res.json({
      message: "Lấy giỏ hàng thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function addItem(
  req: AuthenticatedRequest<Record<string, string>, any, AddItemBody>,
  res: Response
) {
  try {
    const userId = getUserIdFromRequest(req);
    const { courseId, quantity } = req.body;

    const data = await cartService.addItem(userId, courseId, quantity);

    return res.status(201).json({
      message: "Thêm vào giỏ hàng thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateItemQuantity(
  req: AuthenticatedRequest<CourseIdParams, any, UpdateItemQuantityBody>,
  res: Response
) {
  try {
    const userId = getUserIdFromRequest(req);
    const { courseId } = req.params;
    const { quantity } = req.body;

    const data = await cartService.updateItemQuantity(userId, courseId, quantity);

    return res.json({
      message: "Cập nhật số lượng thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function toggleItemSelected(
  req: AuthenticatedRequest<CourseIdParams, any, ToggleItemSelectedBody>,
  res: Response
) {
  try {
    const userId = getUserIdFromRequest(req);
    const { courseId } = req.params;
    const { selected } = req.body;

    const data = await cartService.toggleItemSelected(userId, courseId, selected);

    return res.json({
      message: "Cập nhật chọn sản phẩm thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function selectAllItems(
  req: AuthenticatedRequest<Record<string, string>, any, SelectAllItemsBody>,
  res: Response
) {
  try {
    const userId = getUserIdFromRequest(req);
    const { selected } = req.body;

    const data = await cartService.selectAllItems(userId, selected);

    return res.json({
      message: "Cập nhật chọn tất cả thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function removeItem(
  req: AuthenticatedRequest<CourseIdParams>,
  res: Response
) {
  try {
    const userId = getUserIdFromRequest(req);
    const { courseId } = req.params;

    const data = await cartService.removeItem(userId, courseId);

    return res.json({
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function clearCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = getUserIdFromRequest(req);
    const data = await cartService.clearCart(userId);

    return res.json({
      message: "Xóa toàn bộ giỏ hàng thành công",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}