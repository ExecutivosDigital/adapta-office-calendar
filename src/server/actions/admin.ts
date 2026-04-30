"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminLoginApi,
  adminLogoutApi,
  getAdminReservations,
  getDashboardMetricsApi,
  type AdminFilters,
} from "@/lib/api-client";
import { clearAdminCookie, isAdmin } from "@/lib/admin-auth";
import type { ReservationWithRoom } from "@/types";

export type SignInState = {
  ok: boolean;
  error?: string;
};

export async function signInAdmin(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (username.length < 3) return { ok: false, error: "Usuário precisa ter pelo menos 3 caracteres." };
  if (!password) return { ok: false, error: "Senha obrigatória." };

  try {
    await adminLoginApi(username, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Usuário ou senha incorretos.";
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function signOutAdmin() {
  try {
    await adminLogoutApi();
  } catch {
    // best-effort — clear local cookie regardless
  }
  await clearAdminCookie();
  redirect("/admin/login");
}

async function ensureAdmin() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

export async function listReservations(
  filters: AdminFilters
): Promise<ReservationWithRoom[]> {
  await ensureAdmin();
  return getAdminReservations(filters);
}

export async function getDashboardMetrics() {
  await ensureAdmin();
  return getDashboardMetricsApi();
}
