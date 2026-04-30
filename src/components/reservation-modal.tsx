"use client";

import { useEffect, useState, useTransition } from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLong, normalizeTime } from "@/lib/time-slots";
import { formatPhone } from "@/lib/utils";
import { createReservation } from "@/server/actions/reservations";
import type { Room } from "@/types";

type Field = "customer_name" | "customer_phone" | "company_name";

export function ReservationModal({
  open,
  onOpenChange,
  room,
  date,
  startTime,
  initialName,
  initialPhone,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  date: string;
  startTime: string | null;
  initialName?: string;
  initialPhone?: string;
  onSuccess: (data: {
    reservation_id: string;
    customer_name: string;
    customer_phone: string;
    company_name: string;
    people_count: number;
  }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  const [customerName, setCustomerName] = useState(initialName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialPhone ? formatPhone(initialPhone) : "");
  const [companyName, setCompanyName] = useState("");

  // Reset state quando o modal reabre
  useEffect(() => {
    if (open) {
      console.log("[reservation-modal] aberto", { room: room?.id, date, startTime });
      setServerError(null);
      setFieldErrors({});
    }
  }, [open, room?.id, date, startTime]);

  if (!room || !startTime) return null;

  function validate(): {
    ok: boolean;
    errors: Partial<Record<Field, string>>;
  } {
    const errors: Partial<Record<Field, string>> = {};
    if (customerName.trim().length < 2)
      errors.customer_name = "Informe seu nome completo.";
    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10)
      errors.customer_phone = "Telefone inválido — inclua DDD + número.";
    if (companyName.trim().length < 2) errors.company_name = "Informe a empresa.";
    return { ok: Object.keys(errors).length === 0, errors };
  }

  async function handleConfirm() {
    console.log("[reservation-modal] handleConfirm chamado");
    setServerError(null);

    const v = validate();
    setFieldErrors(v.errors);

    if (!v.ok) {
      console.warn("[reservation-modal] validação local falhou", v.errors);
      toast.error("Confira os campos do formulário.");
      return;
    }

    const payload = {
      room_id: room!.id,
      date,
      start_time: normalizeTime(startTime!),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      company_name: companyName.trim(),
      people_count: room!.capacity,
    };

    console.log("[reservation-modal] enviando payload", payload);

    startTransition(async () => {
      try {
        const res = await createReservation(payload);
        console.log("[reservation-modal] resposta do servidor", res);

        if (!res.ok) {
          setServerError(res.error);
          toast.error(res.error);
          if (res.code === "CONFLICT") {
            onOpenChange(false);
          }
          return;
        }

        console.log("[reservation-modal] sucesso! id =", res.data.id);
        toast.success("Reserva confirmada!");
        // Limpa antes de fechar
        setCustomerName("");
        setCustomerPhone("");
        setCompanyName("");
        onOpenChange(false);
        onSuccess({
          reservation_id: res.data.id,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          company_name: payload.company_name,
          people_count: payload.people_count,
        });
      } catch (err) {
        console.error("[reservation-modal] exceção inesperada", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Erro inesperado ao reservar. Tente novamente.";
        setServerError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Confirmar reserva</DialogTitle>
          <DialogDescription>
            Preencha seus dados para reservar este horário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-2xl bg-cream/70 p-4 text-sm">
          <div className="flex items-center gap-2 text-stone-700">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span className="font-medium">{room.name}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span className="capitalize">{formatDateLong(date)}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Clock className="h-4 w-4 text-brand-600" />
            <span>
              {startTime} — {addOneHour(startTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>Capacidade máxima: {room.capacity} pessoas</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">Nome completo</Label>
            <Input
              id="customer_name"
              name="name"
              placeholder="Como gostaria de ser chamado(a)?"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.customer_name && (
              <p className="text-xs text-red-600">{fieldErrors.customer_name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_phone">Telefone / WhatsApp</Label>
            <Input
              id="customer_phone"
              name="tel"
              type="tel"
              placeholder="+55 41 98713-6140"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
              disabled={isPending}
            />
            {fieldErrors.customer_phone && (
              <p className="text-xs text-red-600">{fieldErrors.customer_phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_name">Empresa</Label>
            <Input
              id="company_name"
              name="organization"
              placeholder="Nome da empresa"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.company_name && (
              <p className="text-xs text-red-600">{fieldErrors.company_name}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                console.log("[reservation-modal] botão Confirmar clicado");
                void handleConfirm();
              }}
              disabled={isPending}
            >
              {isPending ? "Confirmando..." : "Confirmar reserva"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function addOneHour(start: string) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
