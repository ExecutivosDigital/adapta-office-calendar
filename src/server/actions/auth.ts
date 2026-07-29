"use server";

import { z } from "zod";
import {
  loginAccountApi,
  logoutAccountApi,
  registerAccountApi,
} from "@/lib/api-client";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";
import type { CurrentUser } from "@/types";

type AuthResult =
  | { ok: true; data: CurrentUser }
  | { ok: false; error: string };

const cpfField = z
  .string()
  .transform(normalizeCpf)
  .refine(isValidCpf, "CPF inválido");

const loginSchema = z.object({
  cpf: cpfField,
  password: z.string().min(1, "Informe sua senha").max(128),
});

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Informe seu nome completo")
    .max(120)
    .refine((name) => name.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  cpf: cpfField,
  company_name: z.string().trim().min(2, "Informe sua empresa").max(120),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(128),
});

export async function loginAccount(raw: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    return { ok: true, data: await loginAccountApi(parsed.data) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível entrar.",
    };
  }
}

export async function registerAccount(raw: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    return { ok: true, data: await registerAccountApi(parsed.data) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível criar a conta.",
    };
  }
}

export async function logoutAccount(): Promise<void> {
  try {
    await logoutAccountApi();
  } catch {
    // O redirecionamento para login continua sendo seguro mesmo se a API cair.
  }
}
