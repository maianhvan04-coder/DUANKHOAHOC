"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import axios from "axios";

import AdminSidebar from "@/components/layouts/admin/sidebar/AdminSidebar";
import AdminTopbar from "@/components/layouts/admin/topbar/AdminTopbar";
import {
  AdminThemeProvider,
  useAdminTheme,
} from "@/providers/admin/AdminDarkmodeProvider";
import { AdminLayoutProvider } from "@/components/layouts/admin/admin-layout-context";
import {
  AdminAutoTranslator,
  AdminPreferencesProvider,
  useAdminPreferences,
} from "@/i18n";
import { AdminToaster } from "@/components/ui/admin/admin-toast";

import {
  rbacApi,
  type PermissionMetaItem,
} from "@/app/api/rbac.api";

import type { AuthUser, UserAccess } from "@/app/api/auth.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { clearAuth } from "@/lib/utils/storage";
import { hasAnyRole } from "@/lib/helpers/auth/access";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ADMIN_LOADING_ANIMATION =
  "https://lottie.host/584935d4-8c45-483b-a01a-bd3576cf3c87/sNTwoeYdhN.lottie";

type AdminBootstrapState = {
  currentUser: AuthUser | null;
  permissionMeta: PermissionMetaItem[];
  userAccess: UserAccess | null;
  ready: boolean;
};

function AdminShellFrame({ children }: { children: ReactNode }) {
  const { theme } = useAdminTheme();
  const { t } = useAdminPreferences();
  const { user, access, hydrated, isLoading } = useAuth();
  const dark = theme === "dark";
  const router = useRouter();

  const [state, setState] = useState<AdminBootstrapState>({
    currentUser: null,
    permissionMeta: [],
    userAccess: null,
    ready: false,
  });

  useEffect(() => {
    if (!hydrated || isLoading) return;

    if (!user || !access) {
      router.replace("/login");
      return;
    }

    const allowed = hasAnyRole(access, ["ADMIN", "MANAGER", "TEACHER"]);

    if (!allowed) {
      router.replace("/403");
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      try {
        const catalogRes = await rbacApi.getCatalog();

        if (!mounted) return;

        setState({
          currentUser: user,
          permissionMeta: catalogRes.permissionMeta ?? [],
          userAccess: access,
          ready: true,
        });
      } catch (error) {
        if (!mounted) return;

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 403) {
            router.replace("/403");
            return;
          }

          if (status === 401) {
            clearAuth();
            router.replace("/login");
            return;
          }
        }

        clearAuth();
        router.replace("/login");
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [access, hydrated, isLoading, router, user]);

  if (!state.ready) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-4 py-16 text-center transition-colors duration-300",
          dark ? "bg-[#0b1220] text-white" : "bg-[#f4f7fb] text-[#0f172a]"
        )}
      >
        <div className="flex w-full max-w-sm flex-col items-center">
          <DotLottieReact
            src={ADMIN_LOADING_ANIMATION}
            loop
            autoplay
            className="h-52 w-52 sm:h-64 sm:w-64"
          />
          <p className="mt-4 text-sm font-semibold opacity-80">
            {t("common.loadingAdmin")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-admin-shell
      className={cn(
        "min-h-screen w-full transition-colors duration-300",
        dark ? "bg-[#0b1220]" : "bg-[#f4f7fb]"
      )}
    >
      <AdminAutoTranslator />
      <AdminToaster theme={dark ? "dark" : "light"} />
      <div className="flex min-h-screen">
        <AdminSidebar
          currentUser={state.currentUser}
          currentRole={state.userAccess?.primaryRole ?? null}
          permissionMeta={state.permissionMeta}
          grantedPermissions={state.userAccess?.permissions ?? []}
        />

        <div className="min-w-0 flex-1 p-5 md:p-7 xl:p-8">
          <AdminTopbar />
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminPreferencesProvider>
        <AdminLayoutProvider>
          <AdminShellFrame>{children}</AdminShellFrame>
        </AdminLayoutProvider>
      </AdminPreferencesProvider>
    </AdminThemeProvider>
  );
}
