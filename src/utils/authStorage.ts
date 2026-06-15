import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, UserAccess } from "../types/auth.type";

const AUTH_TOKEN_KEY = "everest_mobile_access_token";
const AUTH_USER_KEY = "everest_mobile_user";
const AUTH_ACCESS_KEY = "everest_mobile_access";

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const authStorage = {
  getToken: () => AsyncStorage.getItem(AUTH_TOKEN_KEY),

  setToken: (token: string) =>
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),

  getUser: () => readJson<User>(AUTH_USER_KEY),

  setUser: (user: User) =>
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),

  getAccess: () => readJson<UserAccess>(AUTH_ACCESS_KEY),

  setAccess: (access: UserAccess) =>
    AsyncStorage.setItem(AUTH_ACCESS_KEY, JSON.stringify(access)),

  async setAuth(data: {
    accessToken: string;
    user?: User;
    access?: UserAccess;
  }) {
    const tasks: Promise<void>[] = [
      AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken),
    ];

    if (data.user) {
      tasks.push(
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      );
    }

    if (data.access) {
      tasks.push(
        AsyncStorage.setItem(AUTH_ACCESS_KEY, JSON.stringify(data.access))
      );
    }

    await Promise.all(tasks);
  },

  async clear() {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
      AsyncStorage.removeItem(AUTH_ACCESS_KEY),
    ]);
  },
};