import { createElement } from "react";
import { createRoot } from "react-dom/client";

type ToastConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmDialogProps = Required<ToastConfirmOptions> & {
  description: string;
  onResolve: (value: boolean) => void;
};

function ConfirmDialog({
  title,
  description,
  confirmText,
  cancelText,
  onResolve,
}: ConfirmDialogProps) {
  return createElement(
    "div",
    {
      className:
        "fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70",
      role: "dialog",
      "aria-modal": "true",
    },
    createElement(
      "div",
      {
        className:
          "flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white",
      },
      createElement(
        "div",
        { className: "border-b border-slate-200 px-6 py-5 dark:border-white/10" },
        createElement(
          "h2",
          {
            className:
              "text-xl font-semibold leading-tight text-slate-950 dark:text-white",
          },
          title
        )
      ),
      createElement(
        "div",
        { className: "min-h-0 flex-1 border-b border-slate-200 px-6 py-5 dark:border-white/10" },
        createElement(
          "p",
          { className: "text-sm font-medium leading-6 text-slate-700 dark:text-slate-200" },
          description
        )
      ),
      createElement(
        "div",
        { className: "flex items-center justify-end gap-3 px-6 py-4" },
        createElement(
          "button",
          {
            type: "button",
            onClick: () => onResolve(false),
            className:
              "inline-flex h-10 min-w-[92px] items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10",
          },
          cancelText
        ),
        createElement(
          "button",
          {
            type: "button",
            onClick: () => onResolve(true),
            className:
              "inline-flex h-10 min-w-[92px] items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700",
          },
          confirmText
        )
      )
    )
  );
}

export function toastConfirm(
  description: string,
  {
    title = "Xác nhận thao tác",
    confirmText = "OK",
    cancelText = "Đóng",
  }: ToastConfirmOptions = {}
) {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    let settled = false;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    function settle(value: boolean) {
      if (settled) return;
      settled = true;
      resolve(value);
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    }

    root.render(
      createElement(ConfirmDialog, {
        title,
        description,
        confirmText,
        cancelText,
        onResolve: settle,
      })
    );
  });
}
