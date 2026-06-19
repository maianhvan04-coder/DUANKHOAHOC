import { isValidObjectId, Types } from "mongoose";
import { PaymentMethodModel } from "../../payment-method/payment-method.model";
import { UserModel } from "../../user/user.model";
import { WalletTransactionModel } from "../../wallet/wallet.model";
import type {
  PaymentHistoryItem,
  PaymentHistoryListQuery,
  PaymentHistoryListResult,
  PaymentHistoryProvider,
  PaymentHistoryStatus,
  PaymentHistorySummary,
  PaymentHistoryTransactionType,
  PaymentHistoryUser,
} from "./payment-audit.model";

type PaymentMethodSnapshot = {
  _id?: unknown;
  name?: string;
  code?: string;
} | null;

type CourseSnapshot = {
  _id?: unknown;
  title?: string;
  price?: number;
} | null;

const PAYMENT_TRANSACTION_TYPES: PaymentHistoryTransactionType[] = [
  "ENROLL",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUser(user: unknown): PaymentHistoryUser {
  if (!user || typeof user !== "object") return null;

  const value = user as Record<string, unknown>;

  if (!value._id) return null;

  return {
    _id: String(value._id),
    name: String(value.name || ""),
    email: String(value.email || ""),
  };
}

function getPaymentMethod(doc: any): PaymentMethodSnapshot {
  const value = doc.paymentMethod;
  if (!value || typeof value !== "object") return null;
  return value as PaymentMethodSnapshot;
}

function getProvider(method: PaymentMethodSnapshot): PaymentHistoryProvider {
  return method?.name?.trim() || method?.code?.trim() || "balance";
}

function mapTypeToStatus(type: PaymentHistoryTransactionType): PaymentHistoryStatus {
  return "PAID";
}

function getCourse(doc: any): CourseSnapshot {
  const value = doc.course;
  if (!value || typeof value !== "object") return null;
  return value as CourseSnapshot;
}

function buildPaymentCode(doc: any) {
  const createdAt = new Date(doc.createdAt || Date.now()).getTime();
  const idTail = String(doc._id || "").slice(-6);
  const tailNumber = Number.parseInt(idTail, 16);
  const safeTail = Number.isFinite(tailNumber) ? tailNumber % 1000000 : 0;
  return Number(`${String(createdAt).slice(-7)}${String(safeTail).padStart(6, "0")}`);
}

function mapItem(doc: any): PaymentHistoryItem {
  const method = getPaymentMethod(doc);
  const course = getCourse(doc);
  const transactionCode = String(doc.transactionCode || doc._id || "");
  const type = String(doc.type || "ENROLL") as PaymentHistoryTransactionType;
  const amount = Number(doc.amount || 0);
  const courseId = course?._id ? String(course._id) : String(doc.course || "");
  const courseTitle =
    course?.title?.trim() ||
    String(doc.note || "").replace(/^Đăng ký khóa học:\s*/i, "").trim() ||
    "Khóa học";

  return {
    _id: String(doc._id),
    paymentCode: buildPaymentCode(doc),
    transactionCode,
    type,
    provider: getProvider(method),
    status: mapTypeToStatus(type),
    amount,
    items: courseId
      ? [
          {
            courseId,
            title: courseTitle,
            quantity: 1,
            unitPrice: Number(course?.price || amount),
            subtotal: amount,
          },
        ]
      : [],
    gatewayTransactionNo: transactionCode,
    gatewayPayload: {
      type,
      paymentMethod: method
        ? {
            id: String(method._id || ""),
            name: method.name || "",
            code: method.code || "",
          }
        : null,
      transactionCode,
      currency: doc.currency || "VND",
      note: doc.note || "",
      balanceBefore: Number(doc.balanceBefore || 0),
      balanceAfter: Number(doc.balanceAfter || 0),
    },
    paidAt: doc.createdAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    user:
      doc.user && typeof doc.user === "object" && "email" in doc.user
        ? normalizeUser(doc.user)
        : undefined,
  };
}

async function findUserIdsByKeyword(keyword?: string) {
  const normalized = keyword?.trim();
  if (!normalized) return [];

  const regex = new RegExp(escapeRegex(normalized), "i");
  const users = await UserModel.find({
    deletedAt: null,
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id")
    .limit(200)
    .lean();

  return users.map((user) => user._id);
}

async function findPaymentMethodIdsByProvider(provider?: string) {
  const normalized = provider?.trim();
  if (!normalized) return [];

  const regex = new RegExp(`^${escapeRegex(normalized)}$`, "i");
  const methods = await PaymentMethodModel.find({
    $or: [{ name: regex }, { code: regex }],
  })
    .select("_id")
    .lean();

  return methods.map((method) => method._id);
}

async function buildFilter(
  query: Partial<PaymentHistoryListQuery>,
  scopeUserId?: string
) {
  const filter: Record<string, unknown> = {
    type: { $in: PAYMENT_TRANSACTION_TYPES },
  };

  if (scopeUserId) {
    filter.user = new Types.ObjectId(scopeUserId);
  } else if (query.userId) {
    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.paymentCode) {
    const text = String(query.paymentCode).trim();
    if (isValidObjectId(text)) {
      filter._id = new Types.ObjectId(text);
    } else {
      filter.transactionCode = new RegExp(escapeRegex(text), "i");
    }
  }

  if (query.provider) {
    const normalizedProvider = query.provider.trim().toLowerCase();
    if (["balance", "số dư", "so du"].includes(normalizedProvider)) {
      filter.paymentMethod = null;
    } else {
      const methodIds = await findPaymentMethodIdsByProvider(query.provider);
      filter.paymentMethod = methodIds.length
        ? { $in: methodIds }
        : new Types.ObjectId("000000000000000000000000");
    }
  }

  if (query.status && query.status !== "PAID") {
    filter._id = new Types.ObjectId("000000000000000000000000");
  }

  if (query.fromDate || query.toDate) {
    const createdAt: Record<string, Date> = {};

    if (query.fromDate) {
      createdAt.$gte = query.fromDate;
    }

    if (query.toDate) {
      createdAt.$lte = query.toDate;
    }

    filter.createdAt = createdAt;
  }

  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    const regex = new RegExp(escapeRegex(keyword), "i");
    const ors: Record<string, unknown>[] = [
      { transactionCode: regex },
      { note: regex },
    ];

    if (isValidObjectId(keyword)) {
      ors.unshift({ _id: new Types.ObjectId(keyword) });
    }

    if (!scopeUserId) {
      const userIds = await findUserIdsByKeyword(keyword);
      if (userIds.length) {
        ors.push({ user: { $in: userIds } });
      }
    }

    filter.$or = ors;
  }

  if (!scopeUserId && query.userKeyword?.trim()) {
    const userIds = await findUserIdsByKeyword(query.userKeyword);
    filter.user = { $in: userIds };
  }

  return filter;
}

function buildSort(query: PaymentHistoryListQuery) {
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const sortFieldMap: Record<string, string> = {
    paymentCode: "transactionCode",
    provider: "paymentMethod",
    amount: "amount",
    status: "type",
    createdAt: "createdAt",
    paidAt: "createdAt",
  };

  return {
    [sortFieldMap[query.sortBy] || "createdAt"]: direction,
    _id: direction,
  } as Record<string, 1 | -1>;
}

async function getSummary(
  filter: Record<string, unknown>
): Promise<PaymentHistorySummary> {
  const [summary] = await WalletTransactionModel.aggregate<{
    totalOrders: number;
    totalAmount: number;
    paidAmount: number;
    paidCount: number;
  }>([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        paidAmount: { $sum: "$amount" },
        paidCount: { $sum: 1 },
      },
    },
    { $project: { _id: 0 } },
  ]);

  return {
    totalOrders: Number(summary?.totalOrders || 0),
    totalAmount: Number(summary?.totalAmount || 0),
    paidAmount: Number(summary?.paidAmount || 0),
    paidCount: Number(summary?.paidCount || 0),
    pendingCount: 0,
    failedCount: 0,
    cancelledCount: 0,
  };
}

function queryTransactions(filter: Record<string, unknown>) {
  return WalletTransactionModel.find(filter)
    .populate("user", "name email")
    .populate("paymentMethod", "name code")
    .populate("course", "title price")
    .lean();
}

function queryTransaction(filter: Record<string, unknown>) {
  return WalletTransactionModel.findOne(filter)
    .populate("user", "name email")
    .populate("paymentMethod", "name code")
    .populate("course", "title price")
    .lean();
}

export async function getMyPaymentHistoryRepo(
  userId: string,
  query: PaymentHistoryListQuery
): Promise<PaymentHistoryListResult> {
  const skip = (query.page - 1) * query.limit;
  const filter = await buildFilter(query, userId);

  const [docs, total, summary] = await Promise.all([
    queryTransactions(filter)
      .sort(buildSort(query))
      .skip(skip)
      .limit(query.limit),
    WalletTransactionModel.countDocuments(filter),
    getSummary(filter),
  ]);

  return {
    items: docs.map(mapItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    summary,
  };
}

export async function getMyPaymentHistoryDetailRepo(
  userId: string,
  idOrCode: string
): Promise<PaymentHistoryItem | null> {
  const filter: Record<string, unknown> = {
    user: new Types.ObjectId(userId),
    type: { $in: PAYMENT_TRANSACTION_TYPES },
  };

  if (isValidObjectId(idOrCode)) {
    filter._id = new Types.ObjectId(idOrCode);
  } else {
    filter.transactionCode = idOrCode;
  }

  const doc = await queryTransaction(filter);

  return doc ? mapItem(doc) : null;
}

export async function getAdminPaymentHistoryRepo(
  query: PaymentHistoryListQuery
): Promise<PaymentHistoryListResult> {
  const skip = (query.page - 1) * query.limit;
  const filter = await buildFilter(query);

  const [docs, total, summary] = await Promise.all([
    queryTransactions(filter)
      .sort(buildSort(query))
      .skip(skip)
      .limit(query.limit),
    WalletTransactionModel.countDocuments(filter),
    getSummary(filter),
  ]);

  return {
    items: docs.map(mapItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    summary,
  };
}

export async function getAdminPaymentHistoryDetailRepo(
  idOrCode: string
): Promise<PaymentHistoryItem | null> {
  const filter: Record<string, unknown> = {
    type: { $in: PAYMENT_TRANSACTION_TYPES },
  };

  if (isValidObjectId(idOrCode)) {
    filter._id = new Types.ObjectId(idOrCode);
  } else {
    filter.transactionCode = idOrCode;
  }

  const doc = await queryTransaction(filter);

  return doc ? mapItem(doc) : null;
}
