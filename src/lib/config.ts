// Working hours and slot configuration.
// IMPORTANTE: leitura LITERAL de process.env.NEXT_PUBLIC_* — Next.js só inlina
// no bundle do cliente quando o acesso é por propriedade literal. Acesso
// dinâmico (process.env[k]) faz o cliente cair no default sempre.
function clean(v: string | undefined, d: string): string {
  const t = v?.trim();
  return t && t.length > 0 ? t : d;
}

export const config = {
  opening: clean(process.env.NEXT_PUBLIC_OPENING_TIME, "08:00"),
  closing: clean(process.env.NEXT_PUBLIC_CLOSING_TIME, "18:00"),
  slotMinutes: parseInt(
    clean(process.env.NEXT_PUBLIC_SLOT_MINUTES, "60"),
    10
  ),
  openWeekdays: clean(process.env.NEXT_PUBLIC_OPEN_WEEKDAYS, "1,2,3,4,5")
    .split(",")
    .map((d) => parseInt(d, 10))
    .filter((d) => !Number.isNaN(d)),
  timezone: clean(process.env.NEXT_PUBLIC_TIMEZONE, "America/Sao_Paulo"),
};

export const PUBLIC_CONFIG = {
  opening: config.opening,
  closing: config.closing,
  slotMinutes: config.slotMinutes,
  openWeekdays: config.openWeekdays,
};
