import { z } from "zod";

export const reservationSchema = z.object({
  room_id: z.string().uuid("Sala inválida"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  slot_starts: z
    .array(z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"))
    .min(1, "Selecione um horário")
    .max(2, "Selecione no máximo dois horários"),
  people_count: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(1, "Mínimo de 1 pessoa")
    .max(200, "Quantidade muito alta"),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminFiltersSchema = z.object({
  date: z.string().optional(),
  room_id: z.string().optional(),
  status: z.enum(["confirmed", "cancelled"]).optional(),
});

export type AdminFiltersInput = z.infer<typeof adminFiltersSchema>;
