import { API_BASE_URL, API_ENDPOINTS } from "../constants/api";
import { authStorage } from "./authStorage";
import type { RefreshResponse } from "../types/auth.type";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, QueryValue>;
  skipAuth?: boolean;
};

type RequestOptionsWithoutMethod = Omit<RequestOptions, "method">;
type RequestOptionsWithoutBody = Omit<RequestOptions, "method" | "body">;

type HttpClient = {
  <T>(endpoint: string, options?: RequestOptions): Promise<T>;

  get<T>(
    endpoint: string,
    options?: RequestOptionsWithoutBody
  ): Promise<T>;

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ): Promise<T>;

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ): Promise<T>;

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ): Promise<T>;

  delete<T>(
    endpoint: string,
    options?: RequestOptionsWithoutBody
  ): Promise<T>;
};

export class HttpClientError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
    this.data = data;
  }
}

let refreshing: Promise<string> | null = null;

function buildUrl(endpoint: string, params?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (isObject(data) && typeof data.message === "string") {
    return data.message;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return fallback;
}

function isAuthEndpoint(endpoint: string) {
  return (
    endpoint.includes(API_ENDPOINTS.auth.login) ||
    endpoint.includes(API_ENDPOINTS.auth.register) ||
    endpoint.includes(API_ENDPOINTS.auth.refresh) ||
    endpoint.includes(API_ENDPOINTS.auth.logout)
  );
}

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = fetch(buildUrl(API_ENDPOINTS.auth.refresh), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then(async (response) => {
        const data = await parseResponse(response);

        if (!response.ok || !isObject(data)) {
          throw new HttpClientError(
            getErrorMessage(data, "Phiên đăng nhập đã hết hạn"),
            response.status,
            data
          );
        }

        const refreshed = data as RefreshResponse;

        await authStorage.setToken(refreshed.accessToken);

        if (refreshed.access) {
          await authStorage.setAccess(refreshed.access);
        }

        return refreshed.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }

  return refreshing;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retried = false
): Promise<T> {
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  const bodyIsFormData = isFormData(options.body);

  if (
    !bodyIsFormData &&
    options.body !== undefined &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  let requestBody: RequestInit["body"] = undefined;

  if (options.body !== undefined) {
    if (bodyIsFormData) {
      requestBody = options.body as unknown as RequestInit["body"];
    } else {
      requestBody = JSON.stringify(options.body);
    }
  }

  if (!options.skipAuth) {
    const token = await authStorage.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(endpoint, options.params), {
    method,
    headers,
    body: requestBody,
    credentials: "include",
  });

  const data = await parseResponse(response);

  const explicitlyFailed =
    isObject(data) && (data.success === false || data.ok === false);

  if (
    response.status === 401 &&
    !retried &&
    !options.skipAuth &&
    !isAuthEndpoint(endpoint)
  ) {
    try {
      await refreshAccessToken();
      return request<T>(endpoint, options, true);
    } catch (error) {
      await authStorage.clear();
      throw error;
    }
  }

  if (!response.ok || explicitlyFailed) {
    throw new HttpClientError(
      getErrorMessage(data, "Có lỗi xảy ra"),
      response.status,
      data
    );
  }

  return data as T;
}

export const httpClient = Object.assign(request, {
  get: <T>(endpoint: string, options?: RequestOptionsWithoutBody) =>
    request<T>(endpoint, {
      ...(options ?? {}),
      method: "GET",
    }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ) =>
    request<T>(endpoint, {
      ...(options ?? {}),
      method: "POST",
      body,
    }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ) =>
    request<T>(endpoint, {
      ...(options ?? {}),
      method: "PUT",
      body,
    }),

  patch: <T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptionsWithoutMethod
  ) =>
    request<T>(endpoint, {
      ...(options ?? {}),
      method: "PATCH",
      body,
    }),

  delete: <T>(endpoint: string, options?: RequestOptionsWithoutBody) =>
    request<T>(endpoint, {
      ...(options ?? {}),
      method: "DELETE",
    }),
}) satisfies HttpClient;