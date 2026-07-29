"use server";

import { revalidatePath } from "next/cache";
import {
  createReservationApi,
  cancelMyReservationApi,
  cancelAdminReservationApi,
} from "@/lib/api-client";
import type { CreatedReservation } from "@/lib/api-client";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const reservationInputSchema = z.object({
  room_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_starts: z
    .array(z.string().regex(/^\d{2}:\d{2}$/))
    .min(1)
    .max(2),
  people_count: z.number().int().min(1).max(200),
});

export async function createReservation(
  raw: unknown
): Promise<ActionResult<CreatedReservation>> {
  const parsed = reservationInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const result = await createReservationApi({
      room_id: parsed.data.room_id,
      date: parsed.data.date,
      slot_starts: parsed.data.slot_starts,
      people_count: parsed.data.people_count,
    });
    revalidatePath("/");
    revalidatePath("/reservas");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/relatorios/uso");
    return { ok: true, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar reserva.";
    const code = msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("horário") ? "CONFLICT" : undefined;
    return { ok: false, error: msg, ...(code ? { code } : {}) };
  }
}

const cancelSchema = z.object({ reservation_id: z.string().uuid() });

export async function cancelReservation(
  raw: unknown
): Promise<ActionResult<true>> {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  if (!(await isAdmin())) return { ok: false, error: "Acesso negado." };

  try {
    await cancelAdminReservationApi(parsed.data.reservation_id);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/relatorios/uso");
    revalidatePath("/");
    return { ok: true, data: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao cancelar reserva.";
    return { ok: false, error: msg };
  }
}

export async function cancelReservationByCustomer(
  raw: unknown
): Promise<ActionResult<true>> {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  try {
    await cancelMyReservationApi(parsed.data.reservation_id);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/relatorios/uso");
    revalidatePath("/");
    return { ok: true, data: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao cancelar reserva.";
    return { ok: false, error: msg };
  }
}
