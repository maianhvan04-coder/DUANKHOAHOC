import type { PaymentHistoryListQuery } from "./payment-audit.model";
import {
  getAdminPaymentHistoryDetailRepo,
  getAdminPaymentHistoryRepo,
  getMyPaymentHistoryDetailRepo,
  getMyPaymentHistoryRepo,
} from "./payment-audit.repo";

function normalizeListQuery(input: Partial<PaymentHistoryListQuery>): PaymentHistoryListQuery {
  const page = Number(input.page || 1);
  const limit = Number(input.limit || 12);
  const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
  const toDate = input.toDate ? new Date(input.toDate) : undefined;

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 12,
    paymentCode: input.paymentCode ? String(input.paymentCode) : undefined,
    provider: input.provider,
    status: input.status,
    userId: input.userId,
    keyword: input.keyword?.trim() || undefined,
    userKeyword: input.userKeyword?.trim() || undefined,
    fromDate:
      fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    toDate: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    sortBy: input.sortBy || "createdAt",
    sortOrder: input.sortOrder || "desc",
  };
}

export async function getMyPaymentHistoryService(
  userId: string,
  query: Partial<PaymentHistoryListQuery>
) {
  return getMyPaymentHistoryRepo(userId, normalizeListQuery(query));
}

export async function getMyPaymentHistoryDetailService(
  userId: string,
  paymentCode: string
) {
  return getMyPaymentHistoryDetailRepo(userId, paymentCode);
}

export async function getAdminPaymentHistoryService(
  query: Partial<PaymentHistoryListQuery>
) {
  return getAdminPaymentHistoryRepo(normalizeListQuery(query));
}

export async function getAdminPaymentHistoryDetailService(paymentCode: string) {
  return getAdminPaymentHistoryDetailRepo(paymentCode);
}
