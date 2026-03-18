import { Schema, model, Types } from "mongoose";

export type ProductLevel = "Cơ bản" | "Trung cấp" | "Nâng cao";
export type ProductStatus = "OPEN" | "COMING" | "FULL";
export type ProductMode = "ONLINE" | "OFFLINE";

export interface Product {
  title: string;
  slug: string;
  shortDescription: string;
  teacherName: string;
  image: string;
  imagePublicId: string;
  category: Types.ObjectId;
  level: ProductLevel;
  modes: ProductMode[];
  status: ProductStatus;
  rating: number;
  studentCount: number;
  durationText: string;
  price: number;
  originalPrice: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<Product>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      default: "",
    },

    teacherName: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    imagePublicId: {
      type: String,
      default: "",
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    level: {
      type: String,
      enum: ["Cơ bản", "Trung cấp", "Nâng cao"],
      default: "Cơ bản",
    },

    modes: [
      {
        type: String,
        enum: ["ONLINE", "OFFLINE"],
      },
    ],

    status: {
      type: String,
      enum: ["OPEN", "COMING", "FULL"],
      default: "OPEN",
    },

    rating: {
      type: Number,
      default: 0,
    },

    studentCount: {
      type: Number,
      default: 0,
    },

    durationText: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    originalPrice: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

export const ProductModel = model<Product>("Product", productSchema);