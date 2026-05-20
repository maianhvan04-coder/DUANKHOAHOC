import { http } from "@/lib/utils/http";

export type Role = string;
export type PermissionKey = string;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export type UserAccess = {
  primaryRole: Role;
  roles: Role[];
  permissions: PermissionKey[];
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  access: UserAccess;
};

export type MeResponse = {
  user: AuthUser;
  access: UserAccess;
};

export type RefreshResponse = {
  accessToken: string;
  access: UserAccess;
};

export const authApi = {
  login: async (body: { email: string; password: string }) => {
    return (await http.post<AuthResponse>("/api/auth/login", body)).data;
  },

  register: async (body: {
    name: string;
    email: string;
    password: string;
  }) => {
    return (await http.post<AuthResponse>("/api/auth/register", body)).data;
  },

  me: async () => {
    return (await http.get<MeResponse>("/api/auth/me")).data;
  },

  refresh: async () => {
    return (await http.post<RefreshResponse>("/api/auth/refresh")).data;
  },

  logout: async () => {
    return (await http.post<{ ok: boolean }>("/api/auth/logout")).data;
  },
};
