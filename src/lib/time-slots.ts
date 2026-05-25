import { PUBLIC_CONFIG } from "./config";
import type { Slot, SlotStatus } from "@/types";

const pad = (n: number) => n.toString().padStart(2, "0");
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins: number) =>
  `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

export function generateBaseSlots(): { start: string; end: string }[] {
  const open = toMinutes(PUBLIC_CONFIG.opening);
  const close = toMinutes(PUBLIC_CONFIG.closing);
  const step = PUBLIC_CONFIG.slotMinutes;
  const slots: { start: string; end: string }[] = [];
  for (let t = open; t + step <= close; t += step) {
    slots.push({ start: fromMinutes(t), end: fromMinutes(t + step) });
  }
  return slots;
}

export function isOpenWeekday(dateISO: string): boolean {
  const [y, m, d] = dateISO.split("-").map(Number);
  // weekday in local time of the user's browser; we treat date as a wall-clock value
  const weekday = new Date(y, m - 1, d).getDay();
  return PUBLIC_CONFIG.openWeekdays.includes(weekday);
}

export function isPastDate(dateISO: string): boolean {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate()
  )}`;
  return dateISO < todayISO;
}

function isPastSlot(dateISO: string, startHHmm: string): boolean {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
  if (dateISO > todayISO) return false;
  if (dateISO < todayISO) return true;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return toMinutes(startHHmm) <= nowMins;
}

export function buildSlotList(
  dateISO: string,
  takenMap: Map<string, string>
): Slot[] {
  return generateBaseSlots().map(({ start, end }) => {
    let status: SlotStatus = "available";
    let bookedBy: string | undefined;
    const hit = takenMap.get(start) ?? takenMap.get(start + ":00");
    if (isPastSlot(dateISO, start)) {
      status = "past";
    } else if (hit) {
      status = "unavailable";
      bookedBy = hit;
    }
    return { start, end, status, bookedBy };
  });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(d)}/${pad(m)}/${y}`;
}

export function normalizeTime(value: string): string {
  // accepts "HH:mm" or "HH:mm:ss" and returns "HH:mm"
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function addSlotMinutes(start: string): string {
  return fromMinutes(toMinutes(start) + PUBLIC_CONFIG.slotMinutes);
}

export function formatSlotDuration(minutes: number = PUBLIC_CONFIG.slotMinutes): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}`;
}
