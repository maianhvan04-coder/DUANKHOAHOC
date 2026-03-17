import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getToken, setToken, clearToken, clearUser } from "./storage";

type RefreshResponse = { accessToken: string };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
  } else {
    config.headers = config.headers ?? {};
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  return config;
});

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = http
      .post<RefreshResponse>("/api/auth/refresh")
      .then((r) => {
        setToken(r.data.accessToken);
        return r.data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }

  return refreshing;
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (!original) return Promise.reject(error);

    const url = String(original.url ?? "");
    const isAuth =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/logout");

    if (status === 401 && !original._retry && !isAuth) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${newToken}`;

        return http(original);
      } catch {
        clearToken();
        clearUser();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);