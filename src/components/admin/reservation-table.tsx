"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateShort, formatSlotDuration, normalizeTime, durationMinutes, selectionCount } from "@/lib/time-slots";
import type { ReservationWithRoom } from "@/types";

export function ReservationTable({
  reservations,
  onCancel,
}: {
  reservations: ReservationWithRoom[];
  onCancel: (r: ReservationWithRoom) => void;
}) {
  return (
    <div className="hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm lg:block">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-200/70 text-left text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Data / Horário</th>
            <th className="px-4 py-3 font-medium">Sala</th>
            <th className="px-4 py-3 font-medium">Conta / quem marcou</th>
            <th className="px-4 py-3 font-medium">Uso</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {reservations.map((r) => (
            <tr key={r.id} className="hover:bg-stone-50/50">
              <td className="px-4 py-3 text-stone-800">
                <div className="font-medium">
                  {formatDateShort(r.reservation_date)}
                </div>
                <div className="text-xs text-stone-500">
                  {normalizeTime(r.start_time)} — {normalizeTime(r.end_time)}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-800">{r.room.name}</td>
              <td className="px-4 py-3 text-stone-800">
                <div className="font-medium">{r.user_id ? <Link className="hover:text-brand-700 hover:underline" href={`/admin/usuarios/${r.user_id}`}>{r.customer_name}</Link> : r.customer_name}</div>
                <div className="text-xs text-stone-500">{r.company_name}</div>
                <div className="text-xs text-stone-400">
                  Login/CPF: {r.user?.cpf ?? "não vinculado"}
                </div>
                <div className="text-[11px] text-stone-400">
                  Marcada em {formatDateTime(r.created_at)}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-700">
                <div className="font-medium">
                  {selectionCount(r.slot_count, r.start_time, r.end_time)} seleção(ões)
                </div>
                <div className="text-xs text-stone-500">
                  {formatSlotDuration(durationMinutes(r.start_time, r.end_time))}
                </div>
                <div className="text-xs text-stone-400">
                  {r.people_count} pessoa(s)
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={r.status === "confirmed" ? "confirmed" : "cancelled"}
                >
                  {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
                </Badge>
                {r.status === "cancelled" && (
                  <div className="mt-1 text-[11px] text-stone-500">
                    Por: {r.cancelledByUser?.name ?? r.cancelled_by ?? "—"}
                    {r.cancelled_at ? ` · ${formatDateTime(r.cancelled_at)}` : ""}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === "confirmed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(r)}
                  >
                    Cancelar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
