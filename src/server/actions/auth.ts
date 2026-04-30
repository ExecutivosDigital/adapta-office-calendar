"use server";

import { checkPhoneApi, loginByPhoneApi, logoutPhoneApi } from "@/lib/api-client";

export async function checkPhone(phone: string): Promise<{ exists: boolean }> {
  return checkPhoneApi(phone);
}

export async function loginByPhone(
  phone: string,
  name?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await loginByPhoneApi(phone, name);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao entrar. Tente novamente.";
    return { ok: false, error: msg };
  }
}

export async function logoutPhone(): Promise<void> {
  try {
    await logoutPhoneApi();
  } catch {
    // best-effort
  }
}
