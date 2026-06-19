import { isValidObjectId, Types } from "mongoose";

import { ProductModel } from "../course/course.model";
import { createCoursePurchaseAdminNotifications } from "../notification/notification.service";
import { PaymentMethodModel } from "../payment-method/payment-method.model";
import { PaymentOrderModel } from "../payment/payment.model";
import { ensureStudentProfileForPurchaser } from "../student/student-profile.sync";
import { StudentStudyModel } from "../student/student-study.model";
import { UserModel } from "../user/user.model";
import {
  WalletModel,
  WalletTransactionModel,
  type WalletTransactionType,
} from "./wallet.model";

type AppError = Error & { statusCode?: number };
type StudyMode = "ONLINE" | "OFFLINE";
type AdminBalanceTransactionType = "CREDIT" | "DEBIT";
type AdminWalletHistorySortKey =
  | "createdAt"
  | "amount"
  | "balanceBefore"
  | "balanceAfter"
  | "type";

type AdminWalletHistoryQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  reference?: string;
  type?: WalletTransactionType;
  fromDate?: string;
  toDate?: string;
  sortBy?: AdminWalletHistorySortKey;
  sortOrder?: "asc" | "desc";
};

type WalletHistoryFilter = {
  $and?: WalletHistoryFilter[];
  $or?: WalletHistoryFilter[];
  createdAt?: { $gte?: Date; $lte?: Date };
  currency?: RegExp;
  note?: RegExp;
  paymentMethod?: Types.ObjectId | { $in: Types.ObjectId[] };
  transactionCode?: RegExp;
  type?: WalletTransactionType;
  user?: { $in: Types.ObjectId[] };
};

type AdminBalancePayload = {
  amount: number;
  transactionType: AdminBalanceTransactionType;
  paymentMethodId: string;
  transactionCode?: string;
  currency?: string;
  note?: string;
  actorId?: string;
};

const WALLET_HISTORY_TYPES: readonly WalletTransactionType[] = [
  "TOPUP",
  "ENROLL",
  "REFUND",
  "ADMIN_DEBIT",
];

const WALLET_HISTORY_SORT_KEYS = new Set<AdminWalletHistorySortKey>([
  "createdAt",
  "amount",
  "balanceBefore",
  "balanceAfter",
  "type",
]);

function createError(statusCode: number, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

function toObjectId(id: string, message: string) {
  if (!isValidObjectId(id)) throw createError(400, message);
  return new Types.ObjectId(id);
}

async function ensureWallet(userId: string) {
  const user = toObjectId(userId, "Tài khoản không hợp lệ");
  const wallet = await WalletModel.findOneAndUpdate(
    { user },
    { $setOnInsert: { user, balance: 0 } },
    { new: true, upsert: true }
  );

  return wallet;
}

async function ensureStudentAccount(userId: string) {
  const user = await UserModel.findById(userId).select("role deletedAt active");

  if (!user || user.deletedAt) {
    throw createError(404, "Không tìm thấy tài khoản học viên");
  }

  const role = String(user.role || "").toUpperCase();
  if (role !== "STUDENT" && role !== "USER") {
    throw createError(403, "Tài khoản không được phép mua khóa học");
  }

  if (user.active === false) {
    throw createError(403, "Tài khoản học viên đang bị khóa");
  }
}

async function ensureActiveUser(userId: string) {
  const user = await UserModel.findById(userId).select("_id deletedAt active");

  if (!user || user.deletedAt) {
    throw createError(404, "Không tìm thấy tài khoản người dùng");
  }

  if (user.active === false) {
    throw createError(403, "Tài khoản người dùng đang bị khóa");
  }

  return user;
}

async function ensurePaymentMethod(paymentMethodId: string) {
  const methodId = toObjectId(
    paymentMethodId,
    "Phương thức thanh toán không hợp lệ"
  );

  const method = await PaymentMethodModel.findOne({
    _id: methodId,
    isActive: true,
  }).select("_id name code");

  if (!method) {
    throw createError(404, "Không tìm thấy phương thức thanh toán đang hoạt động");
  }

  return method;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePositiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), max);
}

function normalizeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findHistoryUserIds(keyword: string) {
  const regex = new RegExp(escapeRegex(keyword), "i");
  const users = await UserModel.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id")
    .limit(500)
    .lean();

  return users.map((user) => user._id);
}

async function findHistoryPaymentMethodIds(keyword: string) {
  const regex = new RegExp(escapeRegex(keyword), "i");
  const methods = await PaymentMethodModel.find({
    $or: [
      { name: regex },
      { code: regex },
      { bankName: regex },
      { accountNumber: regex },
      { accountName: regex },
    ],
  })
    .select("_id")
    .limit(500)
    .lean();

  return methods.map((method) => method._id);
}

async function buildWalletHistoryFilter(
  query: AdminWalletHistoryQuery,
  options?: { bankOnly?: boolean }
) {
  const filter: WalletHistoryFilter = {};

  if (query.type && WALLET_HISTORY_TYPES.includes(query.type)) {
    filter.type = query.type;
  }

  const fromDate = normalizeDate(query.fromDate);
  const toDate = normalizeDate(query.toDate);
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
  }

  const keyword = String(query.keyword || "").trim();
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    const [userIds, methodIds] = await Promise.all([
      findHistoryUserIds(keyword),
      findHistoryPaymentMethodIds(keyword),
    ]);

    const or: WalletHistoryFilter[] = [
      { transactionCode: regex },
      { note: regex },
      { currency: regex },
    ];

    if (userIds.length) or.push({ user: { $in: userIds } });
    if (methodIds.length) or.push({ paymentMethod: { $in: methodIds } });

    filter.$or = or;
  }

  const reference = String(query.reference || "").trim();
  if (reference) {
    const regex = new RegExp(escapeRegex(reference), "i");
    const referenceOr: WalletHistoryFilter[] = [
      { transactionCode: regex },
      { note: regex },
    ];

    if (filter.$or?.length) {
      filter.$and = [{ $or: filter.$or }, { $or: referenceOr }];
      delete filter.$or;
    } else {
      filter.$or = referenceOr;
    }
  }

  if (options?.bankOnly) {
    const bankMethods = await PaymentMethodModel.find({ type: "BANK" })
      .select("_id")
      .lean();
    const bankMethodIds = bankMethods.map((method) => method._id);
    const bankFilter = { $in: bankMethodIds };

    if (filter.paymentMethod && typeof filter.paymentMethod === "object") {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        { paymentMethod: filter.paymentMethod },
        { paymentMethod: bankFilter },
      ];
      delete filter.paymentMethod;
    } else {
      filter.paymentMethod = bankFilter;
    }
  }

  return filter;
}

async function listWalletHistory(
  query: AdminWalletHistoryQuery,
  options?: { bankOnly?: boolean }
) {
  const page = normalizePositiveInt(query.page, 1, 100000);
  const limit = normalizePositiveInt(query.limit, 10, 100);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy && WALLET_HISTORY_SORT_KEYS.has(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const filter = await buildWalletHistoryFilter(query, options);

  const [items, total] = await Promise.all([
    WalletTransactionModel.find(filter)
      .populate("user", "name email role")
      .populate("actor", "name email role")
      .populate(
        "paymentMethod",
        "name code type bankName accountNumber accountName"
      )
      .sort({ [sortBy]: sortOrder, _id: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    WalletTransactionModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function ensureCanEnroll(params: {
  userId: string;
  courseId: string;
  mode: StudyMode;
}) {
  await ensureStudentAccount(params.userId);

  const course = await ProductModel.findOne({
    _id: toObjectId(params.courseId, "Khóa học không hợp lệ"),
    isDeleted: false,
  });

  if (!course) throw createError(404, "Không tìm thấy khóa học");
  if (course.isActive === false) throw createError(400, "Khóa học đang tạm ẩn");
  if (course.status !== "OPEN") throw createError(400, "Khóa học chưa mở đăng ký");

  if (!course.modes?.includes(params.mode)) {
    throw createError(400, "Khóa học không hỗ trợ hình thức học đã chọn");
  }

  const activeStudy = await StudentStudyModel.findOne({
    student: toObjectId(params.userId, "Tài khoản không hợp lệ"),
    course: course._id,
    isActive: true,
    status: { $ne: "DROPPED" },
  }).lean();

  if (activeStudy) {
    throw createError(409, "Bạn đã đăng ký khóa học này");
  }

  const walletPurchase = await WalletTransactionModel.findOne({
    user: toObjectId(params.userId, "Tài khoản không hợp lệ"),
    type: "ENROLL",
    course: course._id,
  }).lean();

  if (walletPurchase) {
    throw createError(409, "Bạn đã mua khóa học này, vui lòng chờ gán lớp");
  }

  const paymentPurchase = await PaymentOrderModel.findOne({
    user: toObjectId(params.userId, "Tài khoản không hợp lệ"),
    status: { $in: ["PENDING", "PAID"] },
    "items.courseId": String(course._id),
  }).lean();

  if (paymentPurchase) {
    throw createError(409, "Bạn đã mua khóa học này, vui lòng chờ gán lớp");
  }

  return {
    course,
    price: Number(course.price || 0),
  };
}

export const walletService = {
  async getMyWallet(userId: string) {
    const wallet = await ensureWallet(userId);
    const transactions = await WalletTransactionModel.find({
      user: wallet.user,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      balance: Number(wallet.balance || 0),
      transactions,
    };
  },

  async topup(userId: string, amount: number) {
    const safeAmount = Math.trunc(Number(amount || 0));

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw createError(400, "Số tiền nạp không hợp lệ");
    }

    const wallet = await ensureWallet(userId);
    const balanceBefore = Number(wallet.balance || 0);
    wallet.balance = balanceBefore + safeAmount;
    await wallet.save();

    await WalletTransactionModel.create({
      user: wallet.user,
      type: "TOPUP",
      amount: safeAmount,
      balanceBefore,
      balanceAfter: wallet.balance,
      note: "Nạp tiền vào ví học tập",
    });

    return {
      balance: Number(wallet.balance || 0),
    };
  },

  async updateUserBalance(userId: string, payload: AdminBalancePayload) {
    await ensureActiveUser(userId);
    const method = await ensurePaymentMethod(payload.paymentMethodId);

    const safeAmount = Math.trunc(Number(payload.amount || 0));

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw createError(400, "Số tiền cập nhật không hợp lệ");
    }

    const transactionType =
      payload.transactionType === "DEBIT" ? "DEBIT" : "CREDIT";
    const wallet = await ensureWallet(userId);
    const balanceBefore = Number(wallet.balance || 0);
    const balanceAfter =
      transactionType === "DEBIT"
        ? balanceBefore - safeAmount
        : balanceBefore + safeAmount;

    if (balanceAfter < 0) {
      throw createError(400, "Số dư không đủ để trừ tiền");
    }

    wallet.balance = balanceAfter;
    await wallet.save();

    const actor = payload.actorId && isValidObjectId(payload.actorId)
      ? new Types.ObjectId(payload.actorId)
      : null;
    const note = String(payload.note || "").trim();
    const transactionCode = String(payload.transactionCode || "").trim();
    const currency = String(payload.currency || "VND").trim().toUpperCase();

    await WalletTransactionModel.create({
      user: wallet.user,
      type: transactionType === "DEBIT" ? "ADMIN_DEBIT" : "TOPUP",
      amount: safeAmount,
      balanceBefore,
      balanceAfter,
      paymentMethod: method._id,
      actor,
      transactionCode,
      currency: currency || "VND",
      note:
        note ||
        (transactionType === "DEBIT"
          ? `Admin trừ số dư qua ${method.name}`
          : `Admin cộng số dư qua ${method.name}`),
    });

    return {
      balance: Number(wallet.balance || 0),
      balanceBefore,
      balanceAfter,
    };
  },

  async listAdminBalanceHistory(query: AdminWalletHistoryQuery) {
    return listWalletHistory(query);
  },

  async listAdminBankHistory(query: AdminWalletHistoryQuery) {
    return listWalletHistory(query, { bankOnly: true });
  },

  async enroll(userId: string, payload: { courseId: string; mode: StudyMode }) {
    const mode = payload.mode === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const { course, price } = await ensureCanEnroll({
      userId,
      courseId: payload.courseId,
      mode,
    });

    const wallet = await ensureWallet(userId);
    const balanceBefore = Number(wallet.balance || 0);

    if (balanceBefore < price) {
      throw createError(402, "Số dư không đủ để đăng ký khóa học");
    }

    wallet.balance = balanceBefore - price;
    await wallet.save();

    try {
      const synced = await ensureStudentProfileForPurchaser(userId);
      if (!synced) {
        throw createError(400, "Không thể tạo hồ sơ học viên cho tài khoản này");
      }

      await WalletTransactionModel.create({
        user: wallet.user,
        type: "ENROLL",
        amount: price,
        balanceBefore,
        balanceAfter: wallet.balance,
        course: course._id,
        classRoom: null,
        mode,
        note: `Đăng ký khóa học: ${course.title}`,
      });

      try {
        await createCoursePurchaseAdminNotifications({
          userId,
          source: "WALLET",
          amount: price,
          mode,
          courses: [
            {
              courseId: String(course._id),
              title: course.title,
              quantity: 1,
              unitPrice: price,
              subtotal: price,
            },
          ],
        });
      } catch (notificationError) {
        console.error(
          "Failed to create course purchase notifications",
          notificationError
        );
      }

      return {
        balance: Number(wallet.balance || 0),
        item: null,
      };
    } catch (error) {
      const refundBefore = Number(wallet.balance || 0);
      wallet.balance = refundBefore + price;
      await wallet.save();

      await WalletTransactionModel.create({
        user: wallet.user,
        type: "REFUND",
        amount: price,
        balanceBefore: refundBefore,
        balanceAfter: wallet.balance,
        course: course._id,
        classRoom: null,
        mode,
        note: "Hoàn tiền do đăng ký thất bại",
      });

      throw error;
    }
  },
};
