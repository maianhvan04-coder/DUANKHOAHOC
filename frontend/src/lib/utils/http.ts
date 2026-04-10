import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { getToken, setToken, setAccess, clearAuth } from "./storage";

type Role = "ADMIN" | "MANAGER" | "TEACHER" | "STUDENT" | "USER";

type RefreshResponse = {
  accessToken: string;
  access: {
    primaryRole: Role;
    roles: Role[];
    permissions: string[];
  };
};

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

const authHttp: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

function isAuthUrl(url: string): boolean {
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  const url = String(config.url ?? "");

  if (token && !url.includes("/api/auth/refresh")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    config.headers.delete("Content-Type");
  } else if (!config.headers.has("Content-Type")) {
    config.headers.set("Content-Type", "application/json");
  }

  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = authHttp
      .post<RefreshResponse>("/api/auth/refresh")
      .then((response) => {
        const { accessToken, access } = response.data;
        setToken(accessToken);
        setAccess(access);
        return accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }

  return refreshing;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (!original) {
      return Promise.reject(error);
    }

    const url = String(original.url ?? "");
    const authRoute = isAuthUrl(url);

    if (status === 401 && !original._retry && !authRoute) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return http(original);
      } catch (refreshError: unknown) {
        const refreshStatus = getErrorStatus(refreshError);

        if (refreshStatus === 401 || refreshStatus === 403) {
          clearAuth();

          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/login"
          ) {
            window.location.replace("/login");
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);