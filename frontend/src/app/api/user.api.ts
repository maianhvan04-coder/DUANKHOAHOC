import { http } from "@/lib/utils/http";
import type { Role } from "@/app/api/auth.api";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role; // default USER nếu thiếu

  // ✅ status
  active: boolean;

  createdAt?: string;
  updatedAt?: string;

  // ✅ soft delete
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

function parseRole(x: unknown): Role {
  return x === "ADMIN" || x === "USER" ? (x as Role) : "USER";
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

  const active = typeof o.active === "boolean" ? o.active : true;

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
    role: parseRole(o.role),
    active,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    deletedAt,
  };
}

export const userApi = {
  // Users tab: list({deleted:false}) | Deleted tab: list({deleted:true})
  list: async (opts?: { deleted?: boolean }): Promise<UserRow[]> => {
    const deleted = opts?.deleted ? 1 : 0;

    const res = await http.get<unknown>("/api/users", {
      params: { deleted },
    });

    const arr = pickArray(res.data);
    return arr.map(parseUser).filter((x): x is UserRow => x !== null);
  },

  get: async (id: string): Promise<UserRow | null> => {
    const res = await http.get<unknown>(`/api/users/${id}`);
    return parseUser(res.data);
  },

  create: async (payload: Partial<Pick<UserRow, "name" | "email" | "role">>): Promise<UserRow> => {
    const res = await http.post<unknown>("/api/users", payload);
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  update: async (
    id: string,
    payload: Partial<Pick<UserRow, "name" | "email" | "role">>
  ): Promise<UserRow> => {
    const res = await http.patch<unknown>(`/api/users/${id}`, payload);
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  // ✅ đổi ACTIVE/INACTIVE (tab Users)
  setActive: async (id: string, active: boolean): Promise<UserRow> => {
    const res = await http.patch<unknown>(`/api/users/${id}/active`, { active });
    const parsed = parseUser(res.data);
    if (!parsed) throw new Error("Invalid user data");
    return parsed;
  },

  // ✅ soft delete (Users tab) => BE sẽ set deletedAt + active=false
  remove: async (id: string): Promise<void> => {
    await http.delete(`/api/users/${id}`);
  },

  // ✅ hard delete (Deleted tab)
  hardRemove: async (id: string): Promise<void> => {
    await http.delete(`/api/users/${id}/hard`);
  },

  // ✅ restore (Deleted tab) => BE set deletedAt=null + active=true
  restore: async (id: string): Promise<void> => {
    await http.patch(`/api/users/${id}/restore`);
  },
};