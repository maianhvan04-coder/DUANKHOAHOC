// src/lib/utils/storage.ts
export const AUTH_CHANGE_EVENT = "auth:change";
const ADMIN_INTRO_INTENT_KEY = "admin:intro-intent";

let _token: string | null = null;
let _userJson: string | null = null;
let _accessJson: string | null = null;

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

export function getAccessRaw(): string | null {
  return _accessJson;
}

export function getAccess<T>(): T | null {
  if (!_accessJson) return null;

  try {
    return JSON.parse(_accessJson) as T;
  } catch {
    return null;
  }
}

export function setAccess<T>(access: T): void {
  _accessJson = JSON.stringify(access);
  notifyAuthChange();
}

export function clearAccess(): void {
  _accessJson = null;
  notifyAuthChange();
}

export function clearAuth(): void {
  _token = null;
  _userJson = null;
  _accessJson = null;
  notifyAuthChange();
}

export function markAdminIntroIntent(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_INTRO_INTENT_KEY, "1");
}

export function takeAdminIntroIntent(): boolean {
  if (typeof window === "undefined") return false;

  const shouldPlayIntro =
    window.sessionStorage.getItem(ADMIN_INTRO_INTENT_KEY) === "1";
  window.sessionStorage.removeItem(ADMIN_INTRO_INTENT_KEY);

  return shouldPlayIntro;
}
