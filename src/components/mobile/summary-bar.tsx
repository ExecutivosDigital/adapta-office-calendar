"use client";

import { Clock } from "lucide-react";
import { addSlotMinutes, formatSlotDuration } from "@/lib/time-slots";

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d.toString().padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}

export function SummaryBar({
  date,
  startTime,
}: {
  date: string;
  startTime: string | null;
}) {
  const hasSelection = !!startTime;

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/70 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Resumo da reserva
          </p>
          <p className="mt-1 truncate text-base font-semibold text-stone-900">
            {hasSelection
              ? `${formatShort(date)}, ${startTime} — ${addSlotMinutes(startTime!)}`
              : "Selecione um horário acima"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Duração
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 font-display text-xl font-bold text-brand-600">
            <Clock className="h-4 w-4" />
            {formatSlotDuration()}
          </p>
        </div>
      </div>
    </div>
  );
}
