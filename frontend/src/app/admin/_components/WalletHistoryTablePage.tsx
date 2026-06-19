"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  walletApi,
  type AdminWalletHistoryItem,
  type WalletHistorySortKey,
} from "@/app/api/wallet.api";
import AdminListTable, {
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  useAdminPreferences,
  type AdminMessageKey,
} from "@/i18n";
import type { SortDirection } from "@/lib/utils/admin-list";

type WalletHistoryKind = "balance" | "bank";

type WalletHistoryType = AdminWalletHistoryItem["type"];

const TYPE_LABEL_KEYS: Record<WalletHistoryType, AdminMessageKey> = {
  TOPUP: "walletHistory.type.topup",
  ENROLL: "walletHistory.type.enroll",
  REFUND: "walletHistory.type.refund",
  ADMIN_DEBIT: "walletHistory.type.adminDebit",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
      message?: unknown;
    };

    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    const responseError = maybeError.response?.data?.error;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

function getLocaleCode(locale: "vi" | "en") {
  return locale === "en" ? "en-US" : "vi-VN";
}

function formatDate(value: string | undefined, locale: "vi" | "en") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(getLocaleCode(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number, locale: "vi" | "en") {
  return new Intl.NumberFormat(getLocaleCode(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "-").trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getUserName(item: AdminWalletHistoryItem) {
  return item.user?.name?.trim() || item.user?.email?.trim() || "-";
}

function getActorName(item: AdminWalletHistoryItem) {
  return item.actor?.name?.trim() || item.actor?.email?.trim() || "-";
}

function getPaymentMethodName(item: AdminWalletHistoryItem) {
  const method = item.paymentMethod;
  if (!method) return "-";
  return method.name?.trim() || method.code?.trim() || "-";
}

function getBankName(item: AdminWalletHistoryItem) {
  const method = item.paymentMethod;
  if (!method) return "-";
  return method.bankName?.trim() || method.name?.trim() || method.code?.trim() || "-";
}

function getTransactionCode(item: AdminWalletHistoryItem) {
  return item.transactionCode?.trim() || item._id || "-";
}

function getTypeTone(type: WalletHistoryType) {
  switch (type) {
    case "TOPUP":
      return "success" as const;
    case "ADMIN_DEBIT":
      return "danger" as const;
    case "REFUND":
      return "info" as const;
    case "ENROLL":
    default:
      return "warning" as const;
  }
}

function isDebit(type: WalletHistoryType) {
  return type === "ADMIN_DEBIT" || type === "ENROLL";
}

function ToolbarSearchInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="relative min-w-0 flex-[1_1_240px] lg:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

export default function WalletHistoryTablePage({
  kind,
}: {
  kind: WalletHistoryKind;
}) {
  const { locale, t } = useAdminPreferences();
  const isBank = kind === "bank";
  const [items, setItems] = useState<AdminWalletHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedReferenceSearch, setDebouncedReferenceSearch] = useState("");
  const [type, setType] = useState<"" | WalletHistoryType>("");
  const [sortKey, setSortKey] = useState<WalletHistorySortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestIdRef = useRef(0);

  const activeFilterCount = type ? 1 : 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedReferenceSearch(referenceSearch.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [referenceSearch]);

  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const result = isBank
        ? await walletApi.getAdminBankHistory({
            page,
            limit: pageSize,
            keyword: debouncedSearch || undefined,
            reference: debouncedReferenceSearch || undefined,
            type: type || undefined,
            sortBy: sortKey,
            sortOrder: sortDirection,
          })
        : await walletApi.getAdminBalanceHistory({
            page,
            limit: pageSize,
            keyword: debouncedSearch || undefined,
            type: type || undefined,
            sortBy: sortKey,
            sortOrder: sortDirection,
          });

      if (requestId !== requestIdRef.current) return;

      setItems(result.items || []);
      setPage(result.pagination.page);
      setPageSize(result.pagination.limit);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages || 1, 1));
    } catch (loadError: unknown) {
      if (requestId !== requestIdRef.current) return;

      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(
        getErrorMessage(
          loadError,
          t(isBank ? "bankHistory.loadFail" : "balanceHistory.loadFail")
        )
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    debouncedReferenceSearch,
    debouncedSearch,
    isBank,
    page,
    pageSize,
    sortDirection,
    sortKey,
    t,
    type,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "type",
        title: t("walletHistory.filter.type"),
        options: (["TOPUP", "ADMIN_DEBIT", "REFUND", "ENROLL"] as const).map(
          (value) => ({
            id: value,
            label: t(TYPE_LABEL_KEYS[value]),
            checked: type === value,
            onToggle: () => {
              setPage(1);
              setType((current) => (current === value ? "" : value));
            },
          })
        ),
      },
    ],
    [t, type]
  );

  const columns = useMemo<
    AdminTableColumn<AdminWalletHistoryItem, WalletHistorySortKey>[]
  >(() => {
    const userColumn: AdminTableColumn<
      AdminWalletHistoryItem,
      WalletHistorySortKey
    > = {
      id: "user",
      label: t("walletHistory.column.user"),
      widthClassName: isBank ? "w-[17%]" : "w-[18%]",
      headerClassName: "break-words",
      render: (item) => (
        <AdminEntityCell
          title={getUserName(item)}
          subtitle={item.user?.email || "-"}
          fallback={getInitials(item.user?.name, item.user?.email)}
          hideMedia
        />
      ),
    };

    if (isBank) {
      return [
        userColumn,
        {
          id: "bank",
          label: t("bankHistory.column.bank"),
          widthClassName: "w-[18%]",
          headerClassName: "break-words",
          render: (item) => (
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-950 dark:text-white">
                {getBankName(item)}
              </div>
              <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {item.paymentMethod?.accountNumber || item.paymentMethod?.code || "-"}
              </div>
            </div>
          ),
        },
        {
          id: "amount",
          label: t("bankHistory.column.amount"),
          sortKey: "amount",
          widthClassName: "w-[13%]",
          headerClassName: "break-words",
          cellClassName: "whitespace-nowrap",
          render: (item) => (
            <span className="font-bold text-slate-950 dark:text-white">
              {formatMoney(item.amount, locale)}
            </span>
          ),
        },
        {
          id: "note",
          label: t("walletHistory.column.description"),
          widthClassName: "w-[18%]",
          headerClassName: "break-words",
          render: (item) => (
            <span className="line-clamp-2 text-sm">{item.note || "-"}</span>
          ),
        },
        {
          id: "transactionCode",
          label: t("walletHistory.column.transactionCode"),
          widthClassName: "w-[20%]",
          headerClassName: "break-words",
          render: (item) => (
            <div className="min-w-0">
              <div className="truncate font-mono text-xs font-semibold text-slate-950 dark:text-white">
                {getTransactionCode(item)}
              </div>
            </div>
          ),
        },
        {
          id: "createdAt",
          label: t("walletHistory.column.createdAt"),
          sortKey: "createdAt",
          widthClassName: "w-[14%]",
          headerClassName: "break-words",
          cellClassName: "whitespace-nowrap",
          render: (item) => (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatDate(item.createdAt, locale)}
            </span>
          ),
        },
      ];
    }

    return [
      userColumn,
      {
        id: "typeActor",
        label: t("walletHistory.column.type"),
        sortKey: "type",
        widthClassName: "w-[18%]",
        headerClassName: "break-words",
        render: (item) => (
          <div className="min-w-0 space-y-1.5">
            <AdminStatusBadge
              tone={getTypeTone(item.type)}
              className="min-w-[112px] whitespace-nowrap px-3"
            >
              {t(TYPE_LABEL_KEYS[item.type])}
            </AdminStatusBadge>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {t("walletHistory.column.actor")}: {getActorName(item)}
            </div>
          </div>
        ),
      },
      {
        id: "paymentMethod",
        label: t("walletHistory.column.paymentMethod"),
        widthClassName: "w-[18%]",
        headerClassName: "break-words",
        render: (item) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-950 dark:text-white">
              {getPaymentMethodName(item)}
            </div>
            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {getTransactionCode(item)}
            </div>
          </div>
        ),
      },
      {
        id: "amount",
        label: t("walletHistory.column.amount"),
        sortKey: "amount",
        widthClassName: "w-[24%]",
        headerClassName: "break-words",
        render: (item) => (
          <div className="min-w-0">
            <div
              className={
                isDebit(item.type)
                  ? "truncate font-bold text-rose-600 dark:text-rose-300"
                  : "truncate font-bold text-emerald-600 dark:text-emerald-300"
              }
            >
              {isDebit(item.type) ? "-" : "+"}
              {formatMoney(item.amount, locale)}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">
                {t("walletHistory.column.before")}:{" "}
                {formatMoney(item.balanceBefore, locale)}
              </span>
              <span className="truncate">
                {t("walletHistory.column.after")}:{" "}
                {formatMoney(item.balanceAfter, locale)}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "note",
        label: t("walletHistory.column.description"),
        sortKey: "createdAt",
        widthClassName: "w-[22%]",
        headerClassName: "break-words",
        render: (item) => (
          <div className="min-w-0">
            <div className="line-clamp-2 text-sm">{item.note || "-"}</div>
            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {formatDate(item.createdAt, locale)}
            </div>
          </div>
        ),
      },
    ];
  }, [isBank, locale, t]);

  return (
    <main className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <AdminListTable<AdminWalletHistoryItem, WalletHistorySortKey>
        rows={items}
        columns={columns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={isBank ? referenceSearch : search}
        searchPlaceholder={
          isBank
            ? t("bankHistory.searchReferencePlaceholder")
            : t("balanceHistory.searchPlaceholder")
        }
        onSearchChange={(value) => {
          if (isBank) {
            setReferenceSearch(value);
          } else {
            setSearch(value);
          }
          setPage(1);
        }}
        toolbarStart={
          isBank ? (
            <ToolbarSearchInput
              label={t("bankHistory.searchUserPlaceholder")}
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          ) : undefined
        }
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setReferenceSearch("");
          setDebouncedSearch("");
          setDebouncedReferenceSearch("");
          setType("");
          setPage(1);
        }}
        sortBy={sortKey}
        sortOrder={sortDirection}
        onSortChange={(nextSortBy, nextSortOrder) => {
          setSortKey(nextSortBy);
          setSortDirection(nextSortOrder);
          setPage(1);
        }}
        onReload={() => setRefreshKey((current) => current + 1)}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: total,
          pageSize,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          },
          onPageChange: setPage,
          pageSizeOptions: [10, 20, 50],
        }}
        emptyText={t(isBank ? "bankHistory.empty" : "balanceHistory.empty")}
        labels={{
          apply: t("dict.apply"),
          clear: t("dict.clearFilter"),
          filter: t("dict.filter"),
          loading: t(
            isBank ? "bankHistory.loading" : "balanceHistory.loading"
          ),
          noData: t("dict.noData"),
          of: locale === "vi" ? "trên" : "of",
          reload: t("dict.reload"),
          rows: locale === "vi" ? "Dòng" : "Rows",
          search: t("dict.search"),
          showing: t("dict.showing"),
        }}
        tableMinWidthClassName="min-w-full"
        fitContainer
      />
    </main>
  );
}
