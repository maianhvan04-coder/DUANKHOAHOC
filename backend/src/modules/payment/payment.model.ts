import { Schema, model, Types } from "mongoose";
import type { OrderItemSnapshot, PaymentProvider, PaymentStatus } from "./payment.types";

export type PaymentOrderDocument = {
  user: Types.ObjectId;
  provider: PaymentProvider;
  status: PaymentStatus;
  paymentCode: number;
  amount: number;
  items: OrderItemSnapshot[];
  gatewayTransactionNo?: string | null;
  gatewayPayload?: unknown;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const orderItemSchema = new Schema<OrderItemSnapshot>(
  {
    courseId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentOrderSchema = new Schema<PaymentOrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: {
      type: String,
      enum: ["vnpay"],
      required: true,
      index: true,
      default: "vnpay",
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paymentCode: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    items: { type: [orderItemSchema], default: [] },
    gatewayTransactionNo: { type: String, default: null },
    gatewayPayload: { type: Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentOrderSchema.index({ paymentCode: 1, provider: 1 }, { unique: true });
paymentOrderSchema.index({ user: 1, createdAt: -1 });

export const PaymentOrderModel = model<PaymentOrderDocument>(
  "PaymentOrder",
  paymentOrderSchema
);