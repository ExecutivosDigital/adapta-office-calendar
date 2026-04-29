"use client";

const KEY = "adapta:reservations";

export type LocalReservation = {
  id: string;
  room_id: string;
  room_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  company_name: string;
  people_count: number;
  status: "confirmed" | "cancelled";
  created_at: string;
};

export function loadLocalReservations(): LocalReservation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalReservation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReservation(r: LocalReservation): void {
  if (typeof window === "undefined") return;
  const current = loadLocalReservations();
  const next = [r, ...current.filter((x) => x.id !== r.id)];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("adapta:reservations-changed"));
}

export function clearLocalReservations(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("adapta:reservations-changed"));
}

export function removeLocalReservation(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadLocalReservations().filter((r) => r.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("adapta:reservations-changed"));
}

export function markLocalReservationCancelled(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadLocalReservations().map((r) =>
    r.id === id ? { ...r, status: "cancelled" as const } : r
  );
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("adapta:reservations-changed"));
}
