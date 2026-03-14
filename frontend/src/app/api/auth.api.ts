import { http } from "@/lib/utils/http";

export type Role = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export const authApi = {
  login: async (body: { email: string; password: string }) => {
    return (await http.post<AuthResponse>("/api/auth/login", body)).data;
  },

  register: async (body: { name: string; email: string; password: string }) => {
    return (await http.post<AuthResponse>("/api/auth/register", body)).data;
  },

  me: async () => {
    return (await http.get<{ user: AuthUser }>("/api/auth/me")).data;
  },

  refresh: async () => {
    return (await http.post<{ accessToken: string }>("/api/auth/refresh")).data;
  },

  logout: async () => {
    return (await http.post<{ ok: boolean }>("/api/auth/logout")).data;
  },
};
