"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Calendar, Clock, MapPin, UserRound, Users } from "lucide-react";
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
import { formatDateLong } from "@/lib/time-slots";
import { createReservation } from "@/server/actions/reservations";
import type { CreatedReservation } from "@/lib/api-client";
import type { CurrentUser, Room } from "@/types";

export function ReservationModal({
  open,
  onOpenChange,
  room,
  date,
  slotStarts,
  startTime,
  endTime,
  currentUser,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  date: string;
  slotStarts: string[];
  startTime: string | null;
  endTime: string | null;
  currentUser: CurrentUser;
  onSuccess: (data: CreatedReservation) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setServerError(null);
  }, [open, room?.id, date, startTime, endTime]);

  if (!room || !startTime || !endTime || slotStarts.length === 0) return null;
  const selectedRoom = room;

  function handleConfirm() {
    setServerError(null);
    startTransition(async () => {
      const result = await createReservation({
        room_id: selectedRoom.id,
        date,
        slot_starts: slotStarts,
        people_count: 1,
      });

      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        if (result.code === "CONFLICT") onOpenChange(false);
        return;
      }

      toast.success("Reserva confirmada!");
      onOpenChange(false);
      onSuccess(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Confirmar reserva</DialogTitle>
          <DialogDescription>
            Confira o período e confirme o agendamento em seu nome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-2xl bg-cream/70 p-4 text-sm">
          <Info icon={MapPin}>
            <span className="font-medium">{room.name}</span>
          </Info>
          <Info icon={Calendar}>
            <span className="capitalize">{formatDateLong(date)}</span>
          </Info>
          <Info icon={Clock}>
            <span className="font-semibold">
              {startTime} — {endTime}
            </span>
          </Info>
          <Info icon={Users} muted>
            Capacidade máxima: {room.capacity} pessoas
          </Info>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Reserva em nome de
          </p>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">
                {currentUser.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-600">
                <Building2 className="h-3.5 w-3.5" />
                {currentUser.company_name}
              </p>
            </div>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Confirmando..." : "Confirmar reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  icon: Icon,
  children,
  muted = false,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "flex items-center gap-2 text-xs text-stone-500" : "flex items-center gap-2 text-stone-700"}>
      <Icon className={muted ? "h-3.5 w-3.5" : "h-4 w-4 text-brand-600"} />
      {children}
    </div>
  );
}
