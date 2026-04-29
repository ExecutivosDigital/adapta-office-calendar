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
import { formatDateShort, normalizeTime } from "@/lib/time-slots";
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
            {reservation.customer_name}
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
        <Item icon={Phone} text={reservation.customer_phone} />
        <Item icon={Building2} text={reservation.company_name} />
      </dl>

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
          {new Date(reservation.cancelled_at).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
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
