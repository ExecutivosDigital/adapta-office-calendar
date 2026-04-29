"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MobileTopBar } from "@/components/mobile/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearLocalReservations,
  loadLocalReservations,
  markLocalReservationCancelled,
  type LocalReservation,
} from "@/lib/local-reservations";
import { formatDateLong, normalizeTime } from "@/lib/time-slots";
import { cancelReservationByCustomer } from "@/server/actions/reservations";
import { cn } from "@/lib/utils";

export function ReservasClient() {
  const [items, setItems] = useState<LocalReservation[] | null>(null);

  useEffect(() => {
    const refresh = () => setItems(loadLocalReservations());
    refresh();
    const onChange = () => refresh();
    window.addEventListener("adapta:reservations-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("adapta:reservations-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <MobileTopBar title="MINHAS RESERVAS" />

      <main className="container space-y-5 py-6">
        {items === null ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center justify-between animate-slide-up">
              <p className="text-sm text-stone-600">
                {items.filter((r) => r.status === "confirmed").length}{" "}
                reserva(s) ativa(s) neste dispositivo.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="tap-scale"
                onClick={() => {
                  if (
                    window.confirm(
                      "Limpar a lista local de reservas? Isso não cancela as reservas no sistema."
                    )
                  ) {
                    clearLocalReservations();
                  }
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Limpar lista
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((r, i) => (
                <Card
                  key={r.id}
                  item={r}
                  delayClass={
                    i === 0
                      ? "stagger-1"
                      : i === 1
                      ? "stagger-2"
                      : i === 2
                      ? "stagger-3"
                      : "stagger-4"
                  }
                />
              ))}
            </div>
          </>
        )}

        <p className="px-1 pt-4 text-xs text-stone-400">
          As reservas aparecem aqui apenas no aparelho em que foram feitas.
          Para dúvidas, fale com a equipe pelo WhatsApp.
        </p>
      </main>
    </div>
  );
}

function Card({
  item,
  delayClass,
}: {
  item: LocalReservation;
  delayClass: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const isCancelled = item.status === "cancelled";

  function handleCancel() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const res = await cancelReservationByCustomer({ reservation_id: item.id });
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      markLocalReservationCancelled(item.id);
      toast.success("Reserva cancelada — horário liberado.");
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md animate-slide-up",
        delayClass,
        isCancelled ? "border-stone-200 opacity-75" : "border-brand-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-stone-900">
            {item.room_name}
          </h3>
          <p className="text-xs text-stone-500">
            Reserva #{item.id.slice(0, 8)}
          </p>
        </div>
        <Badge variant={isCancelled ? "cancelled" : "confirmed"}>
          {isCancelled ? "Cancelada" : "Confirmada"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-stone-700">
        <Item
          icon={Calendar}
          text={capitalize(formatDateLong(item.reservation_date))}
        />
        <Item
          icon={Clock}
          text={`${normalizeTime(item.start_time)} — ${normalizeTime(
            item.end_time
          )}`}
        />
        <Item icon={Users} text={`${item.people_count} pessoas`} />
        <Item icon={Building2} text={item.company_name} />
        <Item icon={MapPin} text={item.customer_name} />
        <Item icon={Phone} text={item.customer_phone} />
      </dl>

      {!isCancelled && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          {confirming && (
            <p className="mb-2 text-xs text-amber-700">
              Toque novamente para confirmar o cancelamento. O horário voltará
              a ficar disponível.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="tap-scale w-full border-red-200 bg-red-50/40 text-red-700 hover:border-red-300 hover:bg-red-50"
            onClick={handleCancel}
            disabled={isPending}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            {isPending
              ? "Cancelando..."
              : confirming
              ? "Confirmar cancelamento"
              : "Cancelar agendamento"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Item({
  icon: Icon,
  text,
}: {
  icon: typeof Calendar;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-stone-400" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-14 text-center animate-slide-up">
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-brand-100"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-brand-200/50 animate-pulse-ring"
        />
        <CalendarPlus className="relative h-8 w-8 text-brand-600" />
      </div>
      <h3 className="font-display text-xl font-bold text-stone-900">
        Nenhuma reserva ainda
      </h3>
      <p className="mx-auto mt-1 max-w-[20ch] text-sm text-stone-500">
        Faça sua primeira reserva e ela aparecerá aqui.
      </p>
      <Link href="/" className="mt-6 inline-block">
        <Button className="tap-scale">Reservar uma sala</Button>
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-32 overflow-hidden rounded-2xl bg-stone-100/70"
        >
          <div className="h-full w-full animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
