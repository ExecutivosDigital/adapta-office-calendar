"use client";

import { cn } from "@/lib/utils";
import {
  addDays,
  isOpenWeekday,
  isPastDate,
  todayISO,
} from "@/lib/time-slots";

const WEEKDAY_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

function buildDays(centerISO: string, ahead = 21) {
  const days: { iso: string; weekday: number; day: number; month: number }[] = [];
  for (let i = 0; i <= ahead; i++) {
    const iso = addDays(centerISO, i);
    const [y, m, d] = iso.split("-").map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    days.push({ iso, weekday, day: d, month: m });
  }
  return days;
}

export function MonthDateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const today = todayISO();
  const days = buildDays(today, 21).filter((d) => !isPastDate(d.iso));

  const [vy, vm] = value.split("-").map(Number);
  const monthLabel = `${MONTHS[(vm - 1 + 12) % 12]} ${vy}`;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-stone-900">
          Selecione a Data
        </h3>
        <span className="pb-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
          {monthLabel}
        </span>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {days.map((d) => {
            const open = isOpenWeekday(d.iso);
            const isSelected = d.iso === value;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => open && onChange(d.iso)}
                disabled={!open}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-center transition-all",
                  isSelected &&
                    "border-brand-500 bg-brand-500 text-white shadow-md",
                  !isSelected && open &&
                    "border-stone-200 bg-white text-stone-700 hover:border-brand-300 hover:bg-brand-50",
                  !open &&
                    "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider",
                    isSelected ? "text-white/90" : "text-stone-500"
                  )}
                >
                  {WEEKDAY_SHORT[d.weekday]}
                </span>
                <span className="font-display text-2xl font-bold leading-none">
                  {d.day.toString().padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
