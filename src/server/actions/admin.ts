"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminLoginApi,
  adminLogoutApi,
  getAdminReservations,
  getDashboardMetricsApi,
  getAdminUsersApi,
  getAdminUserApi,
  getAdminUserReservationsApi,
  getUsageReportApi,
  resetAdminUserPasswordApi,
  type AdminFilters,
  type UsageReport,
} from "@/lib/api-client";
import { clearAdminCookie, isAdmin } from "@/lib/admin-auth";
import type { AdminUserDetails, AdminUser, Paginated, ReservationWithRoom } from "@/types";

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

export async function listAdminUsers(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paginated<AdminUser>> {
  await ensureAdmin();
  return getAdminUsersApi(filters);
}

export async function getAdminUser(userId: string): Promise<AdminUserDetails> {
  await ensureAdmin();
  return getAdminUserApi(userId);
}

export async function listAdminUserReservations(
  userId: string,
  filters: { page?: number; pageSize?: number; status?: "confirmed" | "cancelled" } = {}
): Promise<Paginated<ReservationWithRoom>> {
  await ensureAdmin();
  return getAdminUserReservationsApi(userId, filters);
}

export async function resetAdminUserPassword(
  userId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdmin();
  if (password.length < 8) {
    return { ok: false, error: "A senha deve ter pelo menos 8 caracteres." };
  }
  try {
    await resetAdminUserPasswordApi(userId, password);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível redefinir a senha.",
    };
  }
}

export async function getUsageReport(filters: {
  from?: string;
  to?: string;
  room_id?: string;
} = {}): Promise<UsageReport> {
  await ensureAdmin();
  return getUsageReportApi(filters);
}
