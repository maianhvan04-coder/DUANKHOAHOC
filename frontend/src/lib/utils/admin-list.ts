export type SortDirection = "asc" | "desc";

export type SortValue = string | number | boolean | Date | null | undefined;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function makePaginationMeta(
  total: number,
  page = 1,
  limit = Math.max(total, 1)
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
  };
}

export function readPaginationMeta(
  raw: unknown,
  total: number,
  page = 1,
  limit = Math.max(total, 1)
): PaginationMeta {
  if (!raw || typeof raw !== "object") {
    return makePaginationMeta(total, page, limit);
  }

  const pagination = (raw as Record<string, unknown>).pagination;
  if (!pagination || typeof pagination !== "object") {
    return makePaginationMeta(total, page, limit);
  }

  const value = pagination as Record<string, unknown>;
  const parsedPage = Number(value.page ?? page);
  const parsedLimit = Number(value.limit ?? limit);
  const parsedTotal = Number(value.total ?? total);
  const parsedTotalPages = Number(value.totalPages);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : page,
    limit:
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : limit,
    total:
      Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : total,
    totalPages:
      Number.isFinite(parsedTotalPages) && parsedTotalPages > 0
        ? parsedTotalPages
        : Math.max(1, Math.ceil(total / Math.max(limit, 1))),
  };
}

function toComparable(value: SortValue): string | number | boolean | null {
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

  return value;
}

export function compareSortValues(
  a: SortValue,
  b: SortValue,
  direction: SortDirection = "asc"
) {
  const left = toComparable(a);
  const right = toComparable(b);
  const modifier = direction === "asc" ? 1 : -1;

  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * modifier;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return (Number(left) - Number(right)) * modifier;
  }

  return (
    String(left).localeCompare(String(right), "vi", {
      numeric: true,
      sensitivity: "base",
    }) * modifier
  );
}

export function sortItems<T>(
  items: T[],
  selector: (item: T) => SortValue,
  direction: SortDirection = "asc"
) {
  return [...items].sort((a, b) =>
    compareSortValues(selector(a), selector(b), direction)
  );
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageBounds(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return { totalPages, currentPage, from, to };
}
