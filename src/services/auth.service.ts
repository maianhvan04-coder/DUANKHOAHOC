import { API_ENDPOINTS } from "../constants/api";
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RefreshResponse,
  RegisterPayload,
} from "../types/auth.type";
import { authStorage } from "../utils/authStorage";
import { httpClient } from "../utils/httpClient";

export const authService = {
  async login(payload: LoginPayload) {
    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      payload,
      { skipAuth: true }
    );

    await authStorage.setAuth(response);
    return response;
  },

  async register(payload: RegisterPayload) {
    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.auth.register,
      payload,
      { skipAuth: true }
    );

    await authStorage.setAuth(response);
    return response;
  },

  async me() {
    const response = await httpClient.get<MeResponse>(API_ENDPOINTS.auth.me);
    await authStorage.setUser(response.user);
    await authStorage.setAccess(response.access);
    return response;
  },

  async refresh() {
    const response = await httpClient.post<RefreshResponse>(
      API_ENDPOINTS.auth.refresh,
      undefined,
      { skipAuth: true }
    );

    await authStorage.setToken(response.accessToken);
    await authStorage.setAccess(response.access);
    return response;
  },

  async logout() {
    try {
      await httpClient.post<{ ok: boolean }>(API_ENDPOINTS.auth.logout);
    } finally {
      await authStorage.clear();
    }
  },
};
