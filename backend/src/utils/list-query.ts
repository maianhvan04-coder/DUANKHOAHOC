export type ListQueryInput = Record<string, unknown>;

export type PaginationOptions = {
  enabled: boolean;
  page: number;
  limit: number;
  skip: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getQueryString(input: ListQueryInput, keys: string[]) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

export function parsePagination(
  input: ListQueryInput,
  defaultLimit = 10,
  maxLimit = 100
): PaginationOptions {
  const enabled = input.page !== undefined || input.limit !== undefined;
  const pageNumber = Number(input.page ?? 1);
  const limitNumber = Number(input.limit ?? defaultLimit);

  const page =
    Number.isFinite(pageNumber) && pageNumber > 0 ? Math.trunc(pageNumber) : 1;

  const limit =
    Number.isFinite(limitNumber) && limitNumber > 0
      ? Math.min(Math.trunc(limitNumber), maxLimit)
      : defaultLimit;

  return {
    enabled,
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function makePaginationMeta(
  total: number,
  pagination: PaginationOptions
): PaginationMeta {
  const limit = pagination.enabled
    ? pagination.limit
    : Math.max(total, pagination.limit, 1);

  return {
    page: pagination.enabled ? pagination.page : 1,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function makeListResponse<T>(
  items: T[],
  total: number,
  pagination: PaginationOptions
): ListResponse<T> {
  return {
    items,
    pagination: makePaginationMeta(total, pagination),
  };
}

export function paginateArray<T>(
  items: T[],
  pagination: PaginationOptions
): T[] {
  if (!pagination.enabled) return items;
  return items.slice(pagination.skip, pagination.skip + pagination.limit);
}

export function compareListValues(
  leftValue: unknown,
  rightValue: unknown,
  direction: 1 | -1
) {
  const left = normalizeComparable(leftValue);
  const right = normalizeComparable(rightValue);

  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * direction;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return (Number(left) - Number(right)) * direction;
  }

  return (
    String(left).localeCompare(String(right), "vi", {
      numeric: true,
      sensitivity: "base",
    }) * direction
  );
}

export function normalizeSortOrder(value: unknown): 1 | -1 {
  return String(value || "").toLowerCase() === "asc" ? 1 : -1;
}

function normalizeComparable(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();

  if (typeof value === "string") {
    const trimmed = value.trim();
    const timestamp = Date.parse(trimmed);
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) && !Number.isNaN(timestamp)) {
      return timestamp;
    }

    return trimmed.toLowerCase();
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  return String(value).toLowerCase();
}
