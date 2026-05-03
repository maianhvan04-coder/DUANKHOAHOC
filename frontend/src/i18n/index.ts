export {
  ADMIN_LOCALES,
  STUDENT_LOCALES,
  USER_LOCALES,
  adminMessages,
  studentMessages,
  userMessages,
  type AdminLocale,
  type AdminMessageKey,
  type StudentLocale,
  type StudentMessageKey,
  type StudentTheme,
  type UserLocale,
  type UserMessageKey,
} from "./config";
export {
  StudentPreferencesProvider,
  useStudentPreferences,
} from "./StudentPreferencesProvider";
export {
  AdminAutoTranslator,
  AdminPreferencesProvider,
  useAdminPreferences,
} from "./AdminPreferencesProvider";
export {
  UserPreferencesProvider,
  useUserPreferences,
} from "./UserPreferencesProvider";
