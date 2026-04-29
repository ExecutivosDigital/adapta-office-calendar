import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata WhatsApp/telefone no padrão internacional brasileiro:
// "+55 41 98713-6140" (mobile) ou "+55 41 3333-4444" (fixo).
// Aceita digitação parcial: usuário pode digitar com ou sem o "+55".
export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  // Se o usuário não digitou o DDI, assume 55 (Brasil)
  if (!digits.startsWith("55")) digits = "55" + digits;
  // Trava em 13 dígitos: 55 + 2 (DDD) + 9 (celular)
  digits = digits.slice(0, 13);

  const cc = digits.slice(0, 2);
  const ddd = digits.slice(2, 4);
  const rest = digits.slice(4);

  if (digits.length <= 2) return `+${cc}`;
  if (digits.length <= 4) return `+${cc} ${ddd}`;
  if (rest.length <= 4) return `+${cc} ${ddd} ${rest}`;
  if (rest.length <= 8) {
    // fixo: NNNN-NNNN
    return `+${cc} ${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  // celular: NNNNN-NNNN
  return `+${cc} ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
