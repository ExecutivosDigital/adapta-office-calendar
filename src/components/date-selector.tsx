"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDays,
  isOpenWeekday,
  isPastDate,
  todayISO,
} from "@/lib/time-slots";

const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function buildDays(centerISO: string, radius = 7) {
  const days: { iso: string; weekday: number; day: number }[] = [];
  for (let i = -radius; i <= radius * 2; i++) {
    const iso = addDays(centerISO, i);
    const [y, m, d] = iso.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    days.push({ iso, weekday, day: d });
  }
  return days;
}

export function DateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const today = todayISO();
  const days = buildDays(today, 0).filter((d) => !isPastDate(d.iso));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
          Escolha a data
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const prev = addDays(value, -1);
              if (!isPastDate(prev)) onChange(prev);
            }}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
            disabled={isPastDate(addDays(value, -1))}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange(addDays(value, 1))}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          {days.slice(0, 14).map((d) => {
            const open = isOpenWeekday(d.iso);
            const isSelected = d.iso === value;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => open && onChange(d.iso)}
                disabled={!open}
                className={cn(
                  "flex min-w-[64px] flex-col items-center rounded-2xl border px-3 py-3 text-center transition-all",
                  isSelected
                    ? "border-brand-500 bg-brand-500 text-white shadow-md"
                    : open
                    ? "border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-brand-50"
                    : "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                )}
              >
                <span className="text-[11px] uppercase tracking-wider opacity-80">
                  {WEEKDAY_SHORT[d.weekday]}
                </span>
                <span className="mt-1 text-xl font-semibold leading-none">
                  {d.day.toString().padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
