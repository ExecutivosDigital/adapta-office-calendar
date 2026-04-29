"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { reservationSchema } from "@/lib/schemas";
import {
  cancelReservationRecord,
  createReservationRecord,
  getRoom,
} from "@/lib/store";
import {
  generateBaseSlots,
  isOpenWeekday,
  isPastDate,
  todayISO,
} from "@/lib/time-slots";
import { PUBLIC_CONFIG } from "@/lib/config";
import { getAdminUsername, isAdmin } from "@/lib/admin-auth";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export async function createReservation(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  console.log("[createReservation] raw input", raw);
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    console.warn("[createReservation] schema validation failed", parsed.error.issues);
    return { ok: false, error: first?.message ?? "Dados inválidos" };
  }
  const input = parsed.data;
  console.log("[createReservation] parsed", input);

  if (isPastDate(input.date)) {
    return { ok: false, error: "Data inválida: não é possível reservar no passado." };
  }

  if (!isOpenWeekday(input.date)) {
    return {
      ok: false,
      error: "Esta data não está disponível para agendamento.",
    };
  }

  const baseSlots = generateBaseSlots();
  const slot = baseSlots.find((s) => s.start === input.start_time);
  if (!slot) {
    return { ok: false, error: "Horário inválido para esta sala." };
  }

  if (input.date === todayISO()) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (timeToMinutes(input.start_time) <= nowMins) {
      return { ok: false, error: "Este horário já passou. Escolha outro." };
    }
  }

  const room = await getRoom(input.room_id);
  if (!room) return { ok: false, error: "Sala indisponível." };
  if (input.people_count > room.capacity) {
    return {
      ok: false,
      error: `A capacidade máxima desta sala é ${room.capacity} pessoas.`,
    };
  }

  const end_time = minutesToTime(
    timeToMinutes(input.start_time) + PUBLIC_CONFIG.slotMinutes
  );

  const result = await createReservationRecord({
    room_id: input.room_id,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    company_name: input.company_name,
    people_count: input.people_count,
    reservation_date: input.date,
    start_time: input.start_time,
    end_time,
  });

  if (!result.ok) {
    console.warn("[createReservation] conflict on", {
      room_id: input.room_id,
      date: input.date,
      start_time: input.start_time,
    });
    return {
      ok: false,
      code: "CONFLICT",
      error:
        "Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário.",
    };
  }

  console.log("[createReservation] persisted reservation id =", result.data.id);
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  return { ok: true, data: { id: result.data.id } };
}

const cancelSchema = z.object({ reservation_id: z.string().uuid() });

export async function cancelReservation(
  raw: unknown
): Promise<ActionResult<true>> {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  if (!(await isAdmin())) {
    return { ok: false, error: "Acesso negado." };
  }

  const username = (await getAdminUsername()) ?? "admin";
  const result = await cancelReservationRecord(
    parsed.data.reservation_id,
    username
  );
  if (!result.ok) {
    if (result.reason === "not_found") {
      return { ok: false, error: "Reserva não encontrada." };
    }
    return { ok: false, error: "Esta reserva já está cancelada." };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  return { ok: true, data: true };
}

// Cancelamento iniciado pelo próprio cliente (a partir do success state ou /reservas).
// Não exige admin: assume que quem tem o reservation_id é o dono — UUID v4 é
// inadivinhável e o ID fica salvo no localStorage do navegador que criou.
export async function cancelReservationByCustomer(
  raw: unknown
): Promise<ActionResult<true>> {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  console.log("[cancelReservationByCustomer] id =", parsed.data.reservation_id);
  const result = await cancelReservationRecord(
    parsed.data.reservation_id,
    "customer"
  );
  if (!result.ok) {
    if (result.reason === "not_found") {
      return { ok: false, error: "Reserva não encontrada." };
    }
    return { ok: false, error: "Esta reserva já está cancelada." };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  return { ok: true, data: true };
}
