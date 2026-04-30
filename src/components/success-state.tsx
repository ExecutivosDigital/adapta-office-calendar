"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateLong } from "@/lib/time-slots";
import { cancelReservationByCustomer } from "@/server/actions/reservations";

export function SuccessState({
  reservationId,
  roomName,
  date,
  startTime,
  endTime,
  customerName,
  companyName,
  onNewReservation,
  onCancelled,
}: {
  reservationId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  companyName: string;
  onNewReservation: () => void;
  onCancelled: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  function handleCancel() {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    startTransition(async () => {
      const res = await cancelReservationByCustomer({ reservation_id: reservationId });
      if (!res.ok) {
        toast.error(res.error);
        setConfirmingCancel(false);
        return;
      }
      toast.success("Reserva cancelada. O horário voltou a ficar disponível.");
      onCancelled();
    });
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up space-y-6 rounded-3xl border border-stone-200/70 bg-white p-7 text-center shadow-soft-lg">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 shadow-lg shadow-emerald-500/40"
        />
        <span
          aria-hidden
          className="absolute inset-1 rounded-full bg-white"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-emerald-300/40 animate-pulse-ring"
        />
        <CheckCircle2
          className="relative h-12 w-12 text-emerald-600 animate-confetti-pop"
          strokeWidth={2.5}
        />
      </div>

      <div className="space-y-1.5">
        <span className="eyebrow-pill border-emerald-200 bg-emerald-50 text-emerald-700">
          Confirmado
        </span>
        <h2 className="font-display text-2xl font-extrabold text-stone-900">
          Reserva confirmada
        </h2>
        <p className="text-sm text-stone-500">
          Sua sala foi reservada com sucesso.
        </p>
      </div>

      <dl className="space-y-2 rounded-2xl bg-cream/70 p-4 text-left text-sm">
        <Row label="Sala" value={roomName} />
        <Row label="Data" value={capitalize(formatDateLong(date))} />
        <Row label="Horário" value={`${startTime} — ${endTime}`} />
        <Row label="Nome" value={customerName} />
        <Row label="Empresa" value={companyName} />
      </dl>

      {confirmingCancel && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900 animate-slide-up">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Tem certeza que quer cancelar?</p>
            <p className="text-amber-800/90">
              O horário ficará disponível novamente para outra pessoa. Toque em
              "Cancelar agendamento" de novo para confirmar.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <Button
          onClick={() => router.push("/")}
          className="tap-scale h-12 w-full bg-brand-gradient text-base font-semibold shadow-brand-glow hover:bg-brand-gradient hover:shadow-brand-glow-lg"
          disabled={isPending}
        >
          <Home className="mr-2 h-4 w-4" />
          Voltar para home
        </Button>

        <Button
          onClick={onNewReservation}
          variant="outline"
          className="tap-scale h-12 w-full text-base font-medium"
          disabled={isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          Fazer nova reserva
        </Button>

        <Button
          onClick={handleCancel}
          variant="outline"
          className="tap-scale h-12 w-full border-red-200 bg-red-50/60 text-base font-medium text-red-700 hover:border-red-300 hover:bg-red-50"
          disabled={isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isPending
            ? "Cancelando..."
            : confirmingCancel
            ? "Confirmar cancelamento"
            : "Cancelar agendamento"}
        </Button>
      </div>

      <p className="text-xs text-stone-500">
        Em caso de dúvidas, fale com a equipe pelo WhatsApp na barra inferior.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
