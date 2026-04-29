"use client";

import { cn } from "@/lib/utils";
import type { Slot } from "@/types";

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

export function TimeSlotGrid({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (start: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-500">
        Não há horários disponíveis para esta sala nesta data.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((s) => {
        const isSelected = selected === s.start;
        const disabled = s.status !== "available";
        const isUnavailable = s.status === "unavailable";
        return (
          <button
            key={s.start}
            type="button"
            onClick={() => !disabled && onSelect(s.start)}
            disabled={disabled}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-xl border-2 px-1 leading-tight transition-all",
              isSelected && "border-brand-500 bg-brand-500 text-white shadow",
              !isSelected &&
                s.status === "available" &&
                "border-brand-500 bg-white text-brand-700 hover:bg-brand-50",
              isUnavailable &&
                "cursor-not-allowed border-red-300 bg-red-50 text-red-700",
              s.status === "past" &&
                "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
            )}
            aria-label={
              isUnavailable && s.bookedBy
                ? `${s.start} reservado por ${s.bookedBy}`
                : `Horário ${s.start} às ${s.end}`
            }
          >
            <span className="text-sm font-semibold">{s.start}</span>
            {isUnavailable && s.bookedBy ? (
              <span className="mt-0.5 max-w-full truncate text-[10px] font-medium uppercase tracking-wide text-red-700/90">
                {firstName(s.bookedBy)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
