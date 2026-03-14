import type { ComponentType, ReactNode, SVGProps } from "react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  dark: boolean;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
};

export default function AdminPanel({ dark, title, icon: Icon, children }: Props) {
  return (
    <div
      className={cn(
        "rounded-[30px] border p-6 shadow-sm transition-all duration-300",
        dark
          ? "border-white/10 bg-[#111827] shadow-black/20"
          : "border-black/8 bg-white shadow-black/5"
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <Icon className={cn("h-6 w-6", dark ? "text-[#60a5fa]" : "text-[#1677ff]")} />
        <h3 className={cn("text-[20px] font-bold", dark ? "text-white" : "text-[#0f172a]")}>
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}