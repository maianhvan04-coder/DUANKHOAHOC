import { Types } from "mongoose";
import { PaymentOrderModel, type PaymentOrderDocument } from "../../payment/payment.model";
import type {
  PaymentHistoryItem,
  PaymentHistoryListQuery,
  PaymentHistoryListResult,
  PaymentHistoryUser,
} from "./payment-audit.model";

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

function mapItem(doc: any): PaymentHistoryItem {
  return {
    _id: String(doc._id),
    paymentCode: Number(doc.paymentCode || 0),
    provider: doc.provider,
    status: doc.status,
    amount: Number(doc.amount || 0),
    items: Array.isArray(doc.items) ? doc.items : [],
    gatewayTransactionNo: doc.gatewayTransactionNo ?? null,
    gatewayPayload: doc.gatewayPayload ?? null,
    paidAt: doc.paidAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    user:
      doc.user && typeof doc.user === "object" && "email" in doc.user
        ? normalizeUser(doc.user)
        : undefined,
  };
}

function buildFilter(
  query: Partial<PaymentHistoryListQuery>,
  scopeUserId?: string
) {
  const filter: Record<string, unknown> = {};

  if (scopeUserId) {
    filter.user = new Types.ObjectId(scopeUserId);
  } else if (query.userId) {
    filter.user = new Types.ObjectId(query.userId);
  }

  if (query.paymentCode) {
    filter.paymentCode = query.paymentCode;
  }

  if (query.provider) {
    filter.provider = query.provider;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    const regex = new RegExp(escapeRegex(keyword), "i");
    const ors: Record<string, unknown>[] = [
      { gatewayTransactionNo: regex },
      { "items.title": regex },
    ];

    if (/^\d+$/.test(keyword)) {
      ors.unshift({ paymentCode: Number(keyword) });
    }

    filter.$or = ors;
  }

  return filter;
}

export async function getMyPaymentHistoryRepo(
  userId: string,
  query: PaymentHistoryListQuery
): Promise<PaymentHistoryListResult> {
  const skip = (query.page - 1) * query.limit;
  const filter = buildFilter(query, userId);

  const [docs, total] = await Promise.all([
    PaymentOrderModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    PaymentOrderModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(mapItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getMyPaymentHistoryDetailRepo(
  userId: string,
  paymentCode: number
): Promise<PaymentHistoryItem | null> {
  const doc = await PaymentOrderModel.findOne({
    user: new Types.ObjectId(userId),
    paymentCode,
  }).lean();

  return doc ? mapItem(doc) : null;
}

export async function getAdminPaymentHistoryRepo(
  query: PaymentHistoryListQuery
): Promise<PaymentHistoryListResult> {
  const skip = (query.page - 1) * query.limit;
  const filter = buildFilter(query);

  const [docs, total] = await Promise.all([
    PaymentOrderModel.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    PaymentOrderModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(mapItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getAdminPaymentHistoryDetailRepo(
  paymentCode: number
): Promise<PaymentHistoryItem | null> {
  const doc = await PaymentOrderModel.findOne({ paymentCode })
    .populate("user", "name email")
    .lean();

  return doc ? mapItem(doc) : null;
}