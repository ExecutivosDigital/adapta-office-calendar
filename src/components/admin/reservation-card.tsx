"use client";

import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { durationMinutes, formatDateShort, formatSlotDuration, normalizeTime, selectionCount } from "@/lib/time-slots";
import type { ReservationWithRoom } from "@/types";

export function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: ReservationWithRoom;
  onCancel: (r: ReservationWithRoom) => void;
}) {
  const isCancelled = reservation.status === "cancelled";
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-stone-900">
            {reservation.user_id ? <Link className="hover:text-brand-700 hover:underline" href={`/admin/usuarios/${reservation.user_id}`}>{reservation.customer_name}</Link> : reservation.customer_name}
          </p>
          <p className="text-xs text-stone-500">{reservation.company_name}</p>
        </div>
        <Badge variant={isCancelled ? "cancelled" : "confirmed"}>
          {isCancelled ? "Cancelada" : "Confirmada"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-stone-700">
        <Item icon={MapPin} text={reservation.room.name} />
        <Item icon={Users} text={`${reservation.people_count} pessoas`} />
        <Item icon={Calendar} text={formatDateShort(reservation.reservation_date)} />
        <Item
          icon={Clock}
          text={`${normalizeTime(reservation.start_time)} — ${normalizeTime(
            reservation.end_time
          )}`}
        />
        <Item icon={Phone} text={reservation.customer_phone ?? "—"} />
        <Item icon={Building2} text={reservation.company_name} />
      </dl>

      <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
        <p>
          Login/CPF: <span className="font-medium">{reservation.user?.cpf ?? "não vinculado"}</span>
        </p>
        <p className="mt-1">
          Uso: <span className="font-medium">{selectionCount(reservation.slot_count, reservation.start_time, reservation.end_time)} seleção(ões)</span> · {formatSlotDuration(durationMinutes(reservation.start_time, reservation.end_time))}
        </p>
        <p className="mt-1">Marcada em {formatDateTime(reservation.created_at)}</p>
      </div>

      {!isCancelled && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(reservation)}
          >
            Cancelar reserva
          </Button>
        </div>
      )}

      {isCancelled && reservation.cancelled_at && (
        <p className="mt-3 text-xs text-stone-400">
          Cancelada em{" "}
          {formatDateTime(reservation.cancelled_at)} · por {reservation.cancelledByUser?.name ?? reservation.cancelled_by ?? "—"}
        </p>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Item({
  icon: Icon,
  text,
}: {
  icon: typeof User;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-stone-400" />
      <span className="truncate">{text}</span>
    </div>
  );
}
