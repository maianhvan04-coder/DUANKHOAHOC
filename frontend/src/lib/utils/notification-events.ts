export const NOTIFICATION_CHANGED_EVENT = "app:notifications-changed";

export function emitNotificationChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATION_CHANGED_EVENT));
}
