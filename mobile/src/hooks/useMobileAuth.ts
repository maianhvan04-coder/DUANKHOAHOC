import { useCallback, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import { authStorage } from "../utils/authStorage";
import type {
  LoginPayload,
  User,
  UserAccess,
} from "../types/auth.type";

export function useMobileAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const refreshMe = useCallback(async () => {
    const me = await authService.me();
    setUser(me.user);
    setAccess(me.access);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);

      try {
        const [token, storedUser, storedAccess] = await Promise.all([
          authStorage.getToken(),
          authStorage.getUser(),
          authStorage.getAccess(),
        ]);

        if (!mounted) return;

        if (token) {
          setUser(storedUser);
          setAccess(storedAccess);
          await refreshMe();
          return;
        }

        await authService.refresh();
        await refreshMe();
      } catch {
        await authStorage.clear();
        if (!mounted) return;
        setUser(null);
        setAccess(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
        setHydrated(true);
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);

    try {
      const response = await authService.login(payload);
      setUser(response.user);
      setAccess(response.access);
      return response.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccess(null);
      setLoading(false);
    }
  }, []);

  return {
    user,
    access,
    hydrated,
    isLoading,
    login,
    logout,
    refreshMe,
  };
}
