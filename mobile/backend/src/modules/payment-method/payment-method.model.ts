import { Schema, model } from "mongoose";

export type PaymentMethodType = "BANK" | "EWALLET" | "CRYPTO";

export type PaymentMethodDocument = {
  name: string;
  code: string;
  type: PaymentMethodType;
  bankName: string;
  accountNumber: string;
  accountName: string;
  logo: string;
  qrImage: string;
  description: string;
  transferPrefix: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const paymentMethodSchema = new Schema<PaymentMethodDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["BANK", "EWALLET", "CRYPTO"],
      default: "BANK",
      index: true,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    accountName: {
      type: String,
      default: "",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    qrImage: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    transferPrefix: {
      type: String,
      default: "EVR",
      trim: true,
      uppercase: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentMethodSchema.pre("validate", function normalizePaymentMethod() {
  this.code = String(this.code || "").trim().toUpperCase();
  this.transferPrefix = String(this.transferPrefix || "EVR").trim().toUpperCase();
});

export const PaymentMethodModel = model<PaymentMethodDocument>(
  "PaymentMethod",
  paymentMethodSchema
);
