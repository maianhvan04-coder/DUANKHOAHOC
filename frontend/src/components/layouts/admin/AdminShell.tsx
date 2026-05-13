"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
} from "@/i18n";
import { AdminToaster } from "@/components/ui/admin/admin-toast";

import {
  rbacApi,
  type PermissionMetaItem,
} from "@/app/api/rbac.api";

import type { AuthUser, UserAccess } from "@/app/api/auth.api";
import { useAuth } from "@/hooks/auth/useAuth";
import { clearAuth, takeAdminIntroIntent } from "@/lib/utils/storage";
import { hasAnyRole } from "@/lib/helpers/auth/access";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const ADMIN_VARIANT_STEP_MS = 2000;
const ADMIN_REVEAL_AFTER_VARIANT_3_MS = 0;

type AdminBootstrapState = {
  currentUser: AuthUser | null;
  permissionMeta: PermissionMetaItem[];
  userAccess: UserAccess | null;
  ready: boolean;
};

function isReloadNavigation() {
  if (typeof window === "undefined") return false;

  const [navigation] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];

  return navigation?.type === "reload" || performance.navigation?.type === 1;
}

function subscribeToNavigationType() {
  return () => undefined;
}

function AdminLoadingScreen({ activeVariant }: { activeVariant: number }) {
  return (
    <div className="admin-secure-loading relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-center text-sky-100">
      <svg
        className="admin-hud-lines"
        viewBox="0 0 1440 760"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 700 C80 600 120 520 170 540 C220 560 260 650 330 620 C390 594 410 520 468 540 C540 566 560 470 625 385 C705 280 740 330 790 420 C840 512 886 472 935 364 C980 264 1030 250 1080 380 C1125 498 1194 384 1244 278 C1300 160 1320 318 1372 274 C1410 242 1416 110 1440 94"
          className="admin-hud-line admin-hud-line-strong"
        />
        <path
          d="M0 690 C110 575 150 420 218 468 C282 514 240 578 330 600 C410 638 418 436 520 494 C610 546 658 354 736 324 C812 292 816 402 886 418 C962 438 990 258 1050 268 C1130 280 1110 504 1202 412 C1262 352 1264 246 1322 328 C1360 382 1392 280 1440 244"
          className="admin-hud-line"
        />
        <path
          d="M0 620 C72 548 118 520 162 584 C208 648 270 632 320 574 C370 516 432 650 478 604 C532 548 510 402 592 374 C672 348 690 258 750 314 C822 380 858 338 918 382 C982 428 1045 320 1108 304 C1188 284 1175 426 1248 406 C1320 384 1320 290 1440 224"
          className="admin-hud-line admin-hud-line-soft"
        />
      </svg>

      <div className="admin-secure-stage">
        <div className="admin-secure-scene">
          <div className="admin-hud-ring admin-hud-ring-outer" />
          <div className="admin-hud-ring admin-hud-ring-mid" />
          <div className="admin-hud-ring admin-hud-ring-inner" />
          <div className="admin-secure-ring-track" />
          <div className="admin-secure-ring-arc" />
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className="admin-hud-dot"
              style={{ "--dot-angle": `${index * 36 - 22}deg` } as CSSProperties}
            />
          ))}
          <div className="admin-secure-logo-disk">
            <Image
              src="/Logo.png"
              alt="Everest"
              width={380}
              height={240}
              priority
              className="h-auto w-[300px] object-contain opacity-90"
            />
          </div>
        </div>

        <div className="admin-secure-copy font-mono">
          <div className="admin-hud-status-slot">
            <p
              className={cn(
                "admin-hud-status-line text-xl tracking-[0.08em]",
                activeVariant === 1
                  ? "admin-hud-status-line-active text-sky-200"
                  : "text-sky-200/45"
              )}
            >
              Initializing Secure Tunnel...
            </p>
            <p
              className={cn(
                "admin-hud-status-line text-xl tracking-[0.06em]",
                activeVariant === 2
                  ? "admin-hud-status-line-active text-sky-200"
                  : "text-sky-200/45"
              )}
            >
              Optimizing Database Queries...
            </p>
            <p
              className={cn(
                "admin-hud-status-line text-xl tracking-[0.06em]",
                activeVariant === 3
                  ? "admin-hud-status-line-active text-sky-200"
                  : "text-sky-200/45"
              )}
            >
              Loading Advanced Modules...
            </p>
          </div>

          <p className="admin-hud-variant mt-12 text-base tracking-[0.08em] text-sky-300/70">
            Variant {activeVariant} of 3
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminShellFrame({ children }: { children: ReactNode }) {
  const { theme } = useAdminTheme();
  const { user, access, hydrated, isLoading } = useAuth();
  const dark = theme === "dark";
  const router = useRouter();
  const skipIntro = useSyncExternalStore<boolean | null>(
    subscribeToNavigationType,
    isReloadNavigation,
    () => null
  );
  const [enteredWithIntroIntent] = useState(takeAdminIntroIntent);
  const [loadingDelayDone, setLoadingDelayDone] = useState(false);
  const [activeVariant, setActiveVariant] = useState(1);
  const shouldPlayIntro = !skipIntro && enteredWithIntroIntent;

  const [state, setState] = useState<AdminBootstrapState>({
    currentUser: null,
    permissionMeta: [],
    userAccess: null,
    ready: false,
  });

  useEffect(() => {
    if (skipIntro === null || !hydrated || isLoading) return;

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
    let variant2Timer: number | undefined;
    let variant3Timer: number | undefined;
    let revealTimer: number | undefined;

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

        setActiveVariant(1);

        if (!shouldPlayIntro) {
          setActiveVariant(3);
          setLoadingDelayDone(true);
          return;
        }

        variant2Timer = window.setTimeout(() => {
          if (mounted) setActiveVariant(2);
        }, ADMIN_VARIANT_STEP_MS);

        variant3Timer = window.setTimeout(() => {
          if (mounted) setActiveVariant(3);
        }, ADMIN_VARIANT_STEP_MS * 2);

        revealTimer = window.setTimeout(() => {
          if (mounted) setLoadingDelayDone(true);
        }, ADMIN_VARIANT_STEP_MS * 2 + ADMIN_REVEAL_AFTER_VARIANT_3_MS);
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
      if (variant2Timer) window.clearTimeout(variant2Timer);
      if (variant3Timer) window.clearTimeout(variant3Timer);
      if (revealTimer) window.clearTimeout(revealTimer);
    };
  }, [access, hydrated, isLoading, router, shouldPlayIntro, skipIntro, user]);

  if (skipIntro === null || (!state.ready && !shouldPlayIntro)) {
    return null;
  }

  if (!state.ready || !loadingDelayDone) {
    return <AdminLoadingScreen activeVariant={activeVariant} />;
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

        <div className="min-w-0 flex-1">
          <AdminTopbar />
          <main className="px-4 py-5 md:px-5 md:py-6">{children}</main>
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
