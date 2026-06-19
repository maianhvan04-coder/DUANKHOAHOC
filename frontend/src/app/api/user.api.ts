import { http } from "@/lib/utils/http";
import {
  readPaginationMeta,
  type ListResult,
  type SortDirection,
} from "@/lib/utils/admin-list";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  active: boolean;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type AnyObj = Record<string, unknown>;

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const o = raw as AnyObj;
    if (Array.isArray(o.data)) return o.data as unknown[];
    if (Array.isArray(o.users)) return o.users as unknown[];
    if (Array.isArray(o.items)) return o.items as unknown[];
  }

  return [];
}

function parseRole(x: unknown): string {
  return typeof x === "string" && x.trim() ? x.trim().toUpperCase() : "USER";
}

function parseRoles(raw: unknown, fallbackRole: string): string[] {
  if (!Array.isArray(raw)) return [fallbackRole];

  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (typeof item !== "string") continue;
    const role = parseRole(item);
    const key = role.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      out.push(role);
    }
  }

  return out.length ? out : [fallbackRole];
}

function parseUser(it: unknown): UserRow | null {
  if (!it || typeof it !== "object") return null;
  const o = it as AnyObj;

  const id =
    typeof o._id === "string"
      ? o._id
      : typeof o.id === "string"
        ? o.id
        : null;

  const email = typeof o.email === "string" ? o.email : "";
  const name = typeof o.name === "string" ? o.name : "";

  if (!id || !email) return null;

  const role = parseRole(o.role);
  const active = typeof o.active === "boolean" ? o.active : true;
  const balance = Number(o.balance || 0);
  const deletedAt =
    o.deletedAt === null
      ? null
      : typeof o.deletedAt === "string"
        ? o.deletedAt
        : undefined;

  return {
    id,
    name,
    email,
    role,
    roles: parseRoles(o.roles, role),
    active,
    balance: Number.isFinite(balance) ? balance : 0,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    deletedAt,
  };
}

export const userApi = {
  list: async (opts?: {
    deleted?: boolean;
    q?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
  }): Promise<ListResult<UserRow>> => {
    const deleted = opts?.deleted ? 1 : 0;

    const res = await http.get<unknown>("/api/users", {
      params: { ...opts, deleted },
    });

    const arr = pickArray(res.data);
    const items = arr.map(parseUser).filter((x): x is UserRow => x !== null);

    return {
      items,
      pagination: readPaginationMeta(
        res.data,
        items.length,
        opts?.page,
        opts?.limit
      ),
    };
  },

  get: async (id: string): Promise<UserRow | null> => {
    const res = await http.get<unknown>(`/api/users/${id}`);
    return parseUser(res.data);
  },

  create: async (
    payload: Partial<Pick<UserRow, "name" | "email" | "role" | "roles">> & {
      password?: string;
    }
  ): Promise<UserRow> => {
    const res = await http.post<unknown>("/api/users", payload);
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  update: async (
    id: string,
    payload: Partial<Pick<UserRow, "name" | "email" | "role" | "roles">> & {
      password?: string;
    }
  ): Promise<UserRow> => {
    const res = await http.patch<unknown>(`/api/users/${id}`, payload);
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  setActive: async (id: string, active: boolean): Promise<UserRow> => {
    const res = await http.patch<unknown>(`/api/users/${id}/active`, { active });
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  remove: async (id: string): Promise<void> => {
    await http.delete(`/api/users/${id}`);
  },

  hardRemove: async (id: string): Promise<void> => {
    await http.delete(`/api/users/${id}/hard`);
  },

  restore: async (id: string): Promise<void> => {
    await http.patch(`/api/users/${id}/restore`);
  },

  updateBalance: async (
    id: string,
    payload: {
      paymentMethodId: string;
      transactionType: "CREDIT" | "DEBIT";
      amount: number;
      transactionCode?: string;
      currency?: string;
      note: string;
    }
  ): Promise<{ message?: string; balance: number; balanceBefore: number; balanceAfter: number }> => {
    const res = await http.post<{
      message?: string;
      balance: number;
      balanceBefore: number;
      balanceAfter: number;
    }>(`/api/wallet/admin/users/${id}/balance`, payload);

    return res.data;
  },
};
