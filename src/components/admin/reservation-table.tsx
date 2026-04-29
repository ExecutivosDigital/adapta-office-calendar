"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort, normalizeTime } from "@/lib/time-slots";
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
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Empresa</th>
            <th className="px-4 py-3 font-medium">Pessoas</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
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
              <td className="px-4 py-3 text-stone-800">{r.customer_name}</td>
              <td className="px-4 py-3 text-stone-700">{r.company_name}</td>
              <td className="px-4 py-3 text-stone-700">{r.people_count}</td>
              <td className="px-4 py-3 text-stone-700">{r.customer_phone}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={r.status === "confirmed" ? "confirmed" : "cancelled"}
                >
                  {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
                </Badge>
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
