import type { ComponentType, SVGProps } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  dark: boolean;
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconWrap: string;
  iconColor: string;
};

export default function AdminStatCard({
  dark,
  label,
  value,
  change,
  positive = true,
  icon: Icon,
  iconWrap,
  iconColor,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-[28px] border p-6 shadow-sm transition-all duration-300",
        dark
          ? "border-white/10 bg-[#111827] shadow-black/20"
          : "border-black/8 bg-white shadow-black/5"
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", iconWrap)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
            positive
              ? dark
                ? "bg-[#0d6efd]/20 text-[#7eb6ff]"
                : "bg-[#1677ff] text-white"
              : dark
              ? "bg-red-500/15 text-red-300"
              : "bg-red-500 text-white"
          )}
        >
          {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {change}
        </div>
      </div>

      <div className={cn("text-[22px] font-bold", dark ? "text-white" : "text-[#0f172a]")}>
        {value}
      </div>

      <div className={cn("mt-1 text-[18px]", dark ? "text-slate-400" : "text-slate-500")}>
        {label}
      </div>
    </div>
  );
}