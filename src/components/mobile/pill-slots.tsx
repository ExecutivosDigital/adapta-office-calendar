"use client";

import { cn } from "@/lib/utils";
import { CalendarOff } from "lucide-react";
import type { Slot } from "@/types";

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

export function PillSlots({
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
  if (process.env.NODE_ENV !== "production") {
    console.log("[pill-slots] render", { count: slots.length, selected, loading });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <h3 className="font-display text-xl font-bold text-stone-900">
          Horários Disponíveis
        </h3>
        {!loading && slots.length > 0 && (
          <span className="pb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            {slots.filter((s) => s.status === "available").length} livre(s)
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-14 overflow-hidden rounded-2xl bg-stone-100/70"
            >
              <div className="h-full w-full animate-shimmer" />
            </div>
          ))}
        </div>
      ) : slots.length === 0 ? (
        <EmptySlotsMessage />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {slots.map((s, i) => {
            const isSelected = selected === s.start;
            const disabled = s.status !== "available";
            const isUnavailable = s.status === "unavailable";

            return (
              <button
                key={s.start}
                type="button"
                onClick={() => !disabled && onSelect(s.start)}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={
                  isUnavailable && s.bookedBy
                    ? `${s.start} reservado por ${s.bookedBy}`
                    : `Horário ${s.start} às ${s.end}`
                }
                className={cn(
                  "group relative flex h-14 flex-col items-center justify-center rounded-2xl border-2 px-1 text-base font-semibold leading-tight transition-all duration-200 ease-out animate-slide-up",
                  i < 4 ? `stagger-${(i % 4) + 1}` : "",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  // selecionado
                  isSelected &&
                    "border-brand-600 bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-[1.03]",
                  // disponível
                  !isSelected &&
                    s.status === "available" &&
                    "tap-scale cursor-pointer border-brand-500 bg-white text-brand-600 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-md hover:shadow-brand-500/10",
                  // indisponível (vermelho com nome)
                  isUnavailable &&
                    "cursor-not-allowed border-red-300 bg-red-50/80 text-red-700",
                  // passado
                  s.status === "past" &&
                    "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                )}
              >
                {/* Pulse ring no slot selecionado */}
                {isSelected && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl animate-pulse-ring"
                  />
                )}
                <span className={cn(isUnavailable && "text-sm")}>
                  {s.start}
                </span>
                {isUnavailable && s.bookedBy ? (
                  <span className="mt-0.5 max-w-full truncate text-[10px] font-medium uppercase tracking-wide text-red-700/90">
                    {firstName(s.bookedBy)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EmptySlotsMessage() {
  return (
    <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-10 text-center animate-slide-up">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
        <CalendarOff className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-stone-700">
        Sem horários nesta data
      </p>
      <p className="mt-1 text-xs text-stone-500">
        Tente outra data no seletor acima.
      </p>
    </div>
  );
}
