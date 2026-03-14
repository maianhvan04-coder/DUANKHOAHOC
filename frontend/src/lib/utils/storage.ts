// src/lib/utils/storage.ts
export const AUTH_CHANGE_EVENT = "auth:change";

let _token: string | null = null;
let _userJson: string | null = null;

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getToken(): string | null {
  return _token;
}
export function setToken(token: string): void {
  _token = token;
  notifyAuthChange();
}
export function clearToken(): void {
  _token = null;
  notifyAuthChange();
}

export function getUserRaw(): string | null {
  return _userJson;
}

export function getUser<T>(): T | null {
  if (!_userJson) return null;
  try {
    return JSON.parse(_userJson) as T;
  } catch {
    return null;
  }
}
export function setUser<T>(user: T): void {
  _userJson = JSON.stringify(user);
  notifyAuthChange();
}
export function clearUser(): void {
  _userJson = null;
  notifyAuthChange();
}
