import { http } from "@/lib/utils/http";
import {
  readPaginationMeta,
  type ListResult,
  type SortDirection,
} from "@/lib/utils/admin-list";

type AnyObj = Record<string, unknown>;

export type TeacherProductItem = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  studentCount: number;
  image: string;
  price: number;
  originalPrice: number;
};

export type TeacherItem = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  avatar: string;
  active: boolean;
  deletedAt: string | null;
  productCount: number;
  totalStudents: number;
  products: TeacherProductItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTeacherPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarFile?: File | null;
};

export type UpdateTeacherPayload = Partial<{
  name: string;
  email: string;
  password: string;
  phone: string;
  avatarFile: File | null;
}>;

function toObj(value: unknown): AnyObj {
  return value && typeof value === "object" ? (value as AnyObj) : {};
}

function toStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNum(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "on"].includes(normalized)) return true;
    if (["false", "0", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseProduct(raw: unknown): TeacherProductItem {
  const o = toObj(raw);

  return {
    _id: toStr(o._id),
    title: toStr(o.title),
    slug: toStr(o.slug),
    status: toStr(o.status),
    studentCount: toNum(o.studentCount),
    image: toStr(o.image),
    price: toNum(o.price),
    originalPrice: toNum(o.originalPrice),
  };
}

function parseTeacher(raw: unknown): TeacherItem {
  const o = toObj(raw);

  return {
    _id: toStr(o._id),
    userId: toStr(o.userId),
    name: toStr(o.name),
    email: toStr(o.email),
    specialty: toStr(o.specialty),
    phone: toStr(o.phone),
    avatar: toStr(o.avatar),
    active: toBool(o.active, true),
    deletedAt: o.deletedAt == null ? null : toStr(o.deletedAt),
    productCount: toNum(o.productCount),
    totalStudents: toNum(o.totalStudents),
    products: toArray(o.products).map(parseProduct),
    createdAt: o.createdAt ? toStr(o.createdAt) : undefined,
    updatedAt: o.updatedAt ? toStr(o.updatedAt) : undefined,
  };
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const o = toObj(raw);
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.teachers)) return o.teachers;

  return [];
}

function pickTeacher(raw: unknown): TeacherItem {
  const o = toObj(raw);
  if (o.teacher) return parseTeacher(o.teacher);
  if (o.data) return parseTeacher(o.data);
  return parseTeacher(raw);
}

function appendIfDefined(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
}

function buildCreateTeacherFormData(payload: CreateTeacherPayload) {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("password", payload.password);

  appendIfDefined(formData, "phone", payload.phone ?? "");

  if (payload.avatarFile) {
    formData.append("avatar", payload.avatarFile);
  }

  return formData;
}

function buildUpdateTeacherFormData(payload: UpdateTeacherPayload) {
  const formData = new FormData();

  appendIfDefined(formData, "name", payload.name);
  appendIfDefined(formData, "email", payload.email);
  appendIfDefined(formData, "password", payload.password);
  appendIfDefined(formData, "phone", payload.phone);

  if (payload.avatarFile) {
    formData.append("avatar", payload.avatarFile);
  }

  return formData;
}

export const teacherApi = {
  list: async (params?: { q?: string; deleted?: boolean }) => {
    const res = await http.get("/api/teachers", { params });
    return pickArray(res.data).map(parseTeacher);
  },

  listPaged: async (params?: {
    q?: string;
    deleted?: boolean;
    specialty?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
  }): Promise<ListResult<TeacherItem>> => {
    const res = await http.get("/api/teachers", { params });
    const items = pickArray(res.data).map(parseTeacher);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, params?.page, params?.limit),
    };
  },

  listPublic: async (params?: { q?: string }) => {
    const res = await http.get("/api/teachers/public/list", { params });
    return pickArray(res.data).map(parseTeacher);
  },

  getById: async (id: string) => {
    const res = await http.get(`/api/teachers/${id}`);
    return pickTeacher(res.data);
  },

  getMe: async () => {
    const res = await http.get("/api/teachers/me");
    return pickTeacher(res.data);
  },

  create: async (payload: CreateTeacherPayload) => {
    const formData = buildCreateTeacherFormData(payload);
    const res = await http.post("/api/teachers", formData);
    return pickTeacher(res.data);
  },

  update: async (id: string, payload: UpdateTeacherPayload) => {
    const formData = buildUpdateTeacherFormData(payload);
    const res = await http.put(`/api/teachers/${id}`, formData);
    return pickTeacher(res.data);
  },

  setStatus: async (id: string, active: boolean) => {
    const res = await http.patch(`/api/teachers/${id}/status`, { active });
    return pickTeacher(res.data);
  },

  softDelete: async (id: string) => {
    const res = await http.delete(`/api/teachers/${id}`);
    return pickTeacher(res.data);
  },

  restore: async (id: string) => {
    const res = await http.patch(`/api/teachers/${id}/restore`);
    return pickTeacher(res.data);
  },

  hardDelete: async (id: string) => {
    await http.delete(`/api/teachers/${id}/hard`);
    return true;
  },
};
