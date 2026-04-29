import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "amber" | "stone";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-100 text-brand-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    stone: "bg-stone-100 text-stone-700",
  };
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {label}
        </p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            tones[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
