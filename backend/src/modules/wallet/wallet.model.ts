import { Schema, model, Types } from "mongoose";

export type WalletDocument = {
  user: Types.ObjectId;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WalletTransactionType =
  | "TOPUP"
  | "ENROLL"
  | "REFUND"
  | "ADMIN_DEBIT";

export type WalletTransactionDocument = {
  user: Types.ObjectId;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  course?: Types.ObjectId | null;
  classRoom?: Types.ObjectId | null;
  paymentMethod?: Types.ObjectId | null;
  actor?: Types.ObjectId | null;
  mode?: "ONLINE" | "OFFLINE" | null;
  transactionCode?: string;
  currency: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

const walletSchema = new Schema<WalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const walletTransactionSchema = new Schema<WalletTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["TOPUP", "ENROLL", "REFUND", "ADMIN_DEBIT"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    classRoom: {
      type: Schema.Types.ObjectId,
      ref: "ClassRoom",
      default: null,
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    mode: {
      type: String,
      enum: ["ONLINE", "OFFLINE", null],
      default: null,
    },
    transactionCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      default: "VND",
      trim: true,
      uppercase: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

export const WalletModel = model<WalletDocument>("Wallet", walletSchema);
export const WalletTransactionModel = model<WalletTransactionDocument>(
  "WalletTransaction",
  walletTransactionSchema
);
