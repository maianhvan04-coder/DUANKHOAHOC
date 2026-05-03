import { studentEnMessages } from "./messages/en/student";
import { adminEnMessages } from "./messages/en/admin";
import { userEnMessages } from "./messages/en/user";
import { studentViMessages } from "./messages/vi/student";
import { adminViMessages } from "./messages/vi/admin";
import { userViMessages } from "./messages/vi/user";

export type StudentLocale = "vi" | "en";
export type StudentTheme = "light" | "dark";
export type StudentMessageKey = keyof typeof studentViMessages;
type StudentMessageMap = Record<StudentMessageKey, string>;
export type AdminLocale = "vi" | "en";
export type AdminMessageKey = keyof typeof adminViMessages;
type AdminMessageMap = Record<AdminMessageKey, string>;
export type UserLocale = "vi" | "en";
export type UserMessageKey = keyof typeof userViMessages;
type UserMessageMap = Record<UserMessageKey, string>;

export const STUDENT_LOCALES = [
  {
    code: "vi",
    label: "VI",
    nameKey: "settings.vietnamese",
  },
  {
    code: "en",
    label: "EN",
    nameKey: "settings.english",
  },
] as const satisfies Array<{
  code: StudentLocale;
  label: string;
  nameKey: StudentMessageKey;
}>;

export const studentMessages = {
  vi: studentViMessages,
  en: studentEnMessages,
} as const satisfies Record<StudentLocale, StudentMessageMap>;

export const ADMIN_LOCALES = [
  {
    code: "vi",
    label: "VI",
    nameKey: "language.vietnamese",
  },
  {
    code: "en",
    label: "EN",
    nameKey: "language.english",
  },
] as const satisfies Array<{
  code: AdminLocale;
  label: string;
  nameKey: AdminMessageKey;
}>;

export const adminMessages = {
  vi: adminViMessages,
  en: adminEnMessages,
} as const satisfies Record<AdminLocale, AdminMessageMap>;

export const USER_LOCALES = [
  {
    code: "vi",
    label: "VI",
    nameKey: "language.vietnamese",
  },
  {
    code: "en",
    label: "EN",
    nameKey: "language.english",
  },
] as const satisfies Array<{
  code: UserLocale;
  label: string;
  nameKey: UserMessageKey;
}>;

export const userMessages = {
  vi: userViMessages,
  en: userEnMessages,
} as const satisfies Record<UserLocale, UserMessageMap>;
