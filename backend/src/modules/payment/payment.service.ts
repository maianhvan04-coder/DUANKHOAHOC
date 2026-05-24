import { Types } from "mongoose";
import { PaymentOrderModel } from "./payment.model";
import type {
  CreateCheckoutSessionInput,
  OrderItemSnapshot,
} from "./payment.types";
import { createVnpayCheckout } from "./vnpay.service";

type CheckoutItemLike = {
  courseId: string;
  title: string;
  quantity?: number;
  unitPrice: number;
};

type AppError = Error & { statusCode?: number };

function badRequest(message: string): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = 400;
  return err;
}

function asObjectId(id: string) {
  return new Types.ObjectId(id);
}

function buildCheckoutItems(items: CheckoutItemLike[]): OrderItemSnapshot[] {
  return items
    .map((item) => ({
      ...item,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice),
    }))
    .filter((item) => String(item.courseId || "").trim())
    .filter((item) => String(item.title || "").trim())
    .filter((item) => Number(item.quantity) > 0)
    .filter((item) => Number(item.unitPrice) >= 0)
    .map((item) => ({
      courseId: String(item.courseId),
      title: String(item.title || "Khoa hoc"),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.quantity) * Number(item.unitPrice),
    }));
}

async function createUniquePaymentCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = Number(
      `${Date.now().toString().slice(-10)}${Math.floor(10 + Math.random() * 89)}`
    );

    const exists = await PaymentOrderModel.exists({
      paymentCode: code,
      provider: "vnpay",
    });

    if (!exists) return code;
  }

  throw new Error("Khong tao duoc paymentCode duy nhat");
}

export function buildDirectCheckout(inputItems: CheckoutItemLike[]) {
  const items = buildCheckoutItems(inputItems || []);

  if (!items.length) {
    throw badRequest("Chua co khoa hoc nao de thanh toan");
  }

  const amount = items.reduce((sum, item) => sum + item.subtotal, 0);

  if (amount <= 0) {
    throw badRequest("Tong tien khong hop le");
  }

  return { items, amount };
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const { items, amount } = buildDirectCheckout(input.items);
  const paymentCode = await createUniquePaymentCode();

  const order = await PaymentOrderModel.create({
    user: asObjectId(input.userId),
    provider: "vnpay",
    status: "PENDING",
    paymentCode,
    amount,
    items,
  });

  const vnpayResult = createVnpayCheckout({
    paymentCode,
    amount,
    ipAddr: input.ipAddr,
  });

  order.gatewayPayload = vnpayResult.raw;
  await order.save();

  return {
    provider: "vnpay" as const,
    paymentCode,
    checkoutUrl: vnpayResult.checkoutUrl,
  };
}

export async function findOrderByPaymentCode(paymentCode: number) {
  return PaymentOrderModel.findOne({ paymentCode }).lean();
}

export async function findUserOrderByPaymentCode(paymentCode: number, userId: string) {
  return PaymentOrderModel.findOne({
    paymentCode,
    user: asObjectId(userId),
  }).lean();
}

export async function markOrderFailed(
  paymentCode: number,
  provider: "vnpay",
  payload?: unknown
) {
  const order = await PaymentOrderModel.findOne({ paymentCode, provider });
  if (!order || order.status === "PAID") return order;

  order.status = "FAILED";
  order.gatewayPayload = payload ?? order.gatewayPayload;
  await order.save();
  return order;
}

async function grantPurchasedCourses(userId: string, items: OrderItemSnapshot[]) {
  void userId;
  void items;
}

export async function markOrderPaid(params: {
  paymentCode: number;
  provider: "vnpay";
  gatewayTransactionNo?: string | null;
  gatewayPayload?: unknown;
}) {
  const order = await PaymentOrderModel.findOne({
    paymentCode: params.paymentCode,
    provider: params.provider,
  });

  if (!order) return null;
  if (order.status === "PAID") return order;

  order.status = "PAID";
  order.paidAt = new Date();
  order.gatewayTransactionNo =
    params.gatewayTransactionNo ?? order.gatewayTransactionNo ?? null;
  order.gatewayPayload = params.gatewayPayload ?? order.gatewayPayload;
  await order.save();

  await grantPurchasedCourses(String(order.user), order.items);

  return order;
}
