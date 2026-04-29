"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelReservation } from "@/server/actions/reservations";
import { formatDateShort, normalizeTime } from "@/lib/time-slots";
import type { ReservationWithRoom } from "@/types";

export function CancelReservationModal({
  reservation,
  open,
  onOpenChange,
  onCancelled,
}: {
  reservation: ReservationWithRoom | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCancelled: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!reservation) return null;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await cancelReservation({
        reservation_id: reservation.id,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Reserva cancelada com sucesso.");
      onOpenChange(false);
      onCancelled();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar reserva</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar esta reserva? O horário voltará a
            ficar disponível.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-2xl bg-cream/70 p-4 text-sm">
          <Row icon={MapPin} label={reservation.room.name} />
          <Row
            icon={Calendar}
            label={formatDateShort(reservation.reservation_date)}
          />
          <Row
            icon={Clock}
            label={`${normalizeTime(reservation.start_time)} — ${normalizeTime(
              reservation.end_time
            )}`}
          />
          <Row
            icon={User}
            label={`${reservation.customer_name} · ${reservation.company_name}`}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
}: {
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-stone-700">
      <Icon className="h-4 w-4 text-brand-600" />
      <span>{label}</span>
    </div>
  );
}
