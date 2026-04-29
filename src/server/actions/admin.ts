"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
} from "@/lib/admin-auth";
import {
  dashboardCounts,
  listReservationsRecord,
  type ListFilters,
} from "@/lib/store";
import type { ReservationWithRoom } from "@/types";

export type SignInState = {
  ok: boolean;
  error?: string;
};

const signInSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usuário precisa ter pelo menos 3 caracteres.")
    .max(40, "Usuário muito longo.")
    .regex(/^[A-Za-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline."),
  password: z.string().min(1, "Senha obrigatória."),
});

export async function signInAdmin(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      error: "ADMIN_PASSWORD não configurada no servidor.",
    };
  }

  if (parsed.data.password !== expected) {
    return { ok: false, error: "Usuário ou senha incorretos." };
  }

  await setAdminCookie(parsed.data.username);
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function signOutAdmin() {
  await clearAdminCookie();
  redirect("/admin/login");
}

async function ensureAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

export async function listReservations(
  filters: ListFilters
): Promise<ReservationWithRoom[]> {
  await ensureAdmin();
  return listReservationsRecord(filters);
}

export async function getDashboardMetrics() {
  await ensureAdmin();
  return dashboardCounts();
}
