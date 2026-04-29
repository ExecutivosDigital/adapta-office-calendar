"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyCta({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-100/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)",
      }}
    >
      <div className="container py-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-bold uppercase tracking-[0.18em] text-white transition-all duration-200 ease-out",
            // gradient principal
            "bg-brand-gradient",
            // sombra tintada brand
            !disabled && "shadow-brand-glow hover:shadow-brand-glow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
            // estado disabled
            "disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:bg-none disabled:hover:translate-y-0",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          )}
        >
          {/* Streak de luz diagonal */}
          {!disabled && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.25)_50%,transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          <span className="relative">{label}</span>
          {!disabled && (
            <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
