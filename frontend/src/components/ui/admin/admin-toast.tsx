"use client";

import { Toaster, toast } from "sonner";

type AdminToastTheme = "light" | "dark";

type AdminConfirmToastOptions = {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  tone?: "warning" | "danger";
};

export function AdminToaster({ theme }: { theme: AdminToastTheme }) {
  return (
    <Toaster
      closeButton
      richColors
      position="top-right"
      theme={theme}
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "!rounded-2xl !border !border-slate-200 !bg-white !px-4 !py-3 !shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:!border-white/10 dark:!bg-slate-950",
          title:
            "!text-sm !font-semibold !leading-5 !text-slate-950 dark:!text-white",
          description:
            "!mt-1 !text-xs !leading-5 !text-slate-500 dark:!text-slate-300",
          actionButton:
            "!h-8 !rounded-xl !bg-sky-600 !px-3 !text-xs !font-semibold !text-white hover:!bg-sky-700",
          cancelButton:
            "!h-8 !rounded-xl !border !border-slate-200 !bg-white !px-3 !text-xs !font-semibold !text-slate-700 hover:!bg-slate-50 dark:!border-white/10 dark:!bg-slate-900 dark:!text-slate-100 dark:hover:!bg-white/10",
          success:
            "!border-emerald-200 !bg-emerald-50 dark:!border-emerald-400/20 dark:!bg-emerald-950/60",
          error:
            "!border-rose-200 !bg-rose-50 dark:!border-rose-400/20 dark:!bg-rose-950/60",
          warning:
            "!border-amber-200 !bg-amber-50 dark:!border-amber-400/20 dark:!bg-amber-950/60",
          info:
            "!border-sky-200 !bg-sky-50 dark:!border-sky-400/20 dark:!bg-sky-950/60",
        },
      }}
    />
  );
}

export function showAdminConfirmToast({
  cancelLabel = "Hủy",
  confirmLabel = "Xác nhận",
  description,
  message,
  onConfirm,
  tone = "warning",
}: AdminConfirmToastOptions) {
  const id = `admin-confirm-${Date.now()}-${Math.random()}`;
  const notify = tone === "danger" ? toast.error : toast.warning;

  notify(message, {
    id,
    description,
    duration: 10000,
    closeButton: true,
    action: {
      label: confirmLabel,
      onClick: () => {
        toast.dismiss(id);
        void Promise.resolve(onConfirm()).catch((error) => {
          console.error(error);
          toast.error("Thao tác thất bại");
        });
      },
    },
    cancel: {
      label: cancelLabel,
      onClick: () => toast.dismiss(id),
    },
  });
}
