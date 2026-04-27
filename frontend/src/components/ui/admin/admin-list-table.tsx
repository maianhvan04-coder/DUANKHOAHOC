"use client";

import {
  ArrowUpDown,
  BrushCleaning,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Funnel,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SortDirection } from "@/lib/utils/admin-list";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type AdminFilterOption = {
  id: string;
  label: ReactNode;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export type AdminFilterSection = {
  id: string;
  title: ReactNode;
  options: AdminFilterOption[];
};

export type AdminTableColumn<TItem, TSortKey extends string> = {
  id: string;
  label: ReactNode;
  sortKey?: TSortKey;
  widthClassName?: string;
  headerClassName?: string;
  cellClassName?: string;
  align?: "left" | "center" | "right";
  render: (item: TItem) => ReactNode;
};

type AdminPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
};

type AdminListTableLabels = Partial<{
  apply: string;
  clear: string;
  filter: string;
  loading: string;
  noData: string;
  of: string;
  reload: string;
  rows: string;
  search: string;
  showing: string;
}>;

type AdminListTableProps<TItem, TSortKey extends string> = {
  rows: TItem[];
  columns: Array<AdminTableColumn<TItem, TSortKey>>;
  rowKey: (item: TItem) => string;
  loading: boolean;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  filterSections?: AdminFilterSection[];
  activeFilterCount?: number;
  onApplyFilters?: () => void;
  onClearFilters: () => void;
  sortBy: TSortKey;
  sortOrder: SortDirection;
  onSortChange: (sortBy: TSortKey, sortOrder: SortDirection) => void;
  onReload: () => void;
  pagination: AdminPagination;
  emptyText?: string;
  labels?: AdminListTableLabels;
  tableMinWidthClassName?: string;
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
};

const DEFAULT_LABELS = {
  apply: "Apply",
  clear: "Clear",
  filter: "Filter",
  loading: "Loading data...",
  noData: "No data",
  of: "of",
  reload: "Reload",
  rows: "Rows",
  search: "Search",
  showing: "Showing",
} satisfies Required<AdminListTableLabels>;

export function AdminActionIconButton({
  children,
  danger,
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition disabled:pointer-events-none disabled:opacity-45",
        danger
          ? "text-rose-500 hover:bg-rose-500/10"
          : "text-slate-600 hover:bg-sky-500/10 hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-300"
      )}
    >
      {children}
    </button>
  );
}

export function AdminStatusBadge({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone: "success" | "danger" | "warning" | "neutral" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[108px] items-center justify-center rounded-xl px-3 text-[11px] font-semibold uppercase",
        tone === "success" && "bg-emerald-500 text-white",
        tone === "danger" && "bg-rose-500 text-white",
        tone === "warning" && "bg-amber-400 text-slate-950",
        tone === "neutral" && "bg-slate-200 text-slate-700",
        tone === "info" && "bg-sky-500 text-white",
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminEntityCell({
  title,
  subtitle,
  meta,
  image,
  fallback,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  image?: string;
  fallback?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-700 dark:bg-white/10 dark:text-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : icon ? (
          icon
        ) : (
          fallback || "-"
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900 dark:text-white">
          {title}
        </div>
        {subtitle ? (
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </div>
        ) : null}
        {meta ? (
          <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminListTable<TItem, TSortKey extends string>({
  rows,
  columns,
  rowKey,
  loading,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filterSections = [],
  activeFilterCount = 0,
  onApplyFilters,
  onClearFilters,
  sortBy,
  sortOrder,
  onSortChange,
  onReload,
  pagination,
  emptyText,
  labels: labelOverrides,
  tableMinWidthClassName = "min-w-[1080px]",
  toolbarStart,
  toolbarEnd,
}: AdminListTableProps<TItem, TSortKey>) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFilterOpen) return;

    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!filterPopoverRef.current) return;
      if (!filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [isFilterOpen]);

  const handleSortClick = useCallback(
    (nextSortBy: TSortKey) => {
      if (sortBy === nextSortBy) {
        onSortChange(nextSortBy, sortOrder === "asc" ? "desc" : "asc");
        return;
      }

      onSortChange(nextSortBy, "asc");
    },
    [onSortChange, sortBy, sortOrder]
  );

  const pageSizeOptions = useMemo(
    () => pagination.pageSizeOptions ?? [5, 10, 20, 25],
    [pagination.pageSizeOptions]
  );

  const from =
    pagination.totalItems === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const to = Math.min(
    pagination.currentPage * pagination.pageSize,
    pagination.totalItems
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/45">
        <div className="flex flex-wrap items-center gap-3">
          {toolbarStart ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {toolbarStart}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1 lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder || labels.search}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div ref={filterPopoverRef} className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-white/10"
                title={labels.filter}
              >
                <Funnel className="h-4 w-4" />
                <span>{labels.filter}</span>
                <span>({activeFilterCount})</span>
              </button>

              {isFilterOpen ? (
                <div className="absolute right-0 z-[80] mt-2 w-[420px] max-w-[94vw] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-slate-950">
                  <div className="max-h-[62vh] overflow-y-auto pr-1">
                    {filterSections.length ? (
                      <div className="flex flex-col gap-3">
                        {filterSections.map((section) => (
                          <div key={section.id} className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {section.title}
                            </p>
                            <div className="space-y-1.5">
                              {section.options.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  disabled={option.disabled}
                                  onClick={option.onToggle}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-100 dark:hover:bg-white/10"
                                >
                                  <span
                                    className={cn(
                                      "grid h-4 w-4 place-items-center rounded border",
                                      option.checked
                                        ? "border-sky-600 bg-sky-600"
                                        : "border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900"
                                    )}
                                  >
                                    {option.checked ? (
                                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                    ) : null}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">
                                    {option.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-slate-500">
                        {labels.noData}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFilters?.();
                        setIsFilterOpen(false);
                      }}
                      className="h-9 rounded-md bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      {labels.apply}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-white/10"
              title={labels.clear}
            >
              <BrushCleaning className="h-4 w-4" />
              <span>{labels.clear}</span>
            </button>

            <button
              type="button"
              onClick={onReload}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-600 bg-sky-600 text-white transition hover:bg-sky-700"
              title={labels.reload}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>

          {toolbarEnd ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {toolbarEnd}
            </div>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/45">
        <div className="overflow-x-auto">
          <table
            className={cn(
              "w-full table-fixed border-collapse text-sm",
              tableMinWidthClassName
            )}
          >
            <thead className="border-b border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-bold",
                      column.widthClassName,
                      column.headerClassName,
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(column.sortKey as TSortKey)}
                        className={cn(
                          "inline-flex items-center gap-1.5 bg-transparent p-0 text-left text-sm font-bold text-slate-900 transition hover:text-sky-600 dark:text-slate-100 dark:hover:text-sky-300",
                          column.align === "center" && "justify-center",
                          column.align === "right" && "justify-end"
                        )}
                        title={typeof column.label === "string" ? column.label : undefined}
                      >
                        <span>{column.label}</span>
                        {sortBy === column.sortKey ? (
                          sortOrder === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {labels.loading}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {emptyText || labels.noData}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3.5 align-middle text-slate-700 dark:text-slate-200",
                          column.widthClassName,
                          column.cellClassName,
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between dark:border-white/10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span>
              {labels.showing}{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {from}-{to}
              </span>{" "}
              {labels.of}{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {pagination.totalItems}
              </span>
            </span>

            <span>{labels.rows}</span>
            <select
              value={pagination.pageSize}
              onChange={(event) =>
                pagination.onPageSizeChange(Number(event.target.value))
              }
              className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.currentPage - 1))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="inline-flex h-9 min-w-12 items-center justify-center rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white">
              {pagination.currentPage} / {pagination.totalPages}
            </div>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                pagination.onPageChange(
                  Math.min(pagination.totalPages, pagination.currentPage + 1)
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
