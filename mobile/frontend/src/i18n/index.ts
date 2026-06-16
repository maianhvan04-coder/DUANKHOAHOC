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
} from "../config/config-i18n";
export {
  StudentPreferencesProvider,
  useStudentPreferences,
} from "../providers/student/StudentPreferencesProvider";
export {
  AdminAutoTranslator,
  AdminPreferencesProvider,
  useAdminPreferences,
} from "../providers/admin/AdminPreferencesProvider";
export {
  UserPreferencesProvider,
  useUserPreferences,
} from "../providers/client/UserPreferencesProvider";
