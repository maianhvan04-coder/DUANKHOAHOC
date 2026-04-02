import { Schema, model, Types } from "mongoose";

export interface ICartItem {
  course: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  titleSnapshot: string;
  imageSnapshot: string;
  selected: boolean;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    titleSnapshot: {
      type: String,
      trim: true,
      default: "",
    },
    imageSnapshot: {
      type: String,
      trim: true,
      default: "",
    },
    selected: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = model<ICart>("Cart", cartSchema);

export default Cart;