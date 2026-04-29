import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "confirmed" | "cancelled" | "neutral";

const styles: Record<Variant, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-700",
  neutral: "bg-brand-100 text-brand-800",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
