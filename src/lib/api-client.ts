import "server-only";
import { cookies } from "next/headers";
import type {
  CurrentUser,
  Room,
  Slot,
  Reservation,
  ReservationWithRoom,
  AdminUser,
  AdminUserDetails,
  Paginated,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ---------------------------------------------------------------------------
// Cookie forwarding helper
// ---------------------------------------------------------------------------

function parseSetCookie(header: string): { name: string; value: string; maxAge?: number } | null {
  const parts = header.split(";");
  const nameValue = parts[0]?.trim();
  if (!nameValue) return null;
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;
  const name = nameValue.slice(0, eqIdx).trim();
  const value = nameValue.slice(eqIdx + 1).trim();
  const maxAgePart = parts.find((p) => p.trim().toLowerCase().startsWith("max-age="));
  const maxAge = maxAgePart ? parseInt(maxAgePart.trim().split("=")[1] ?? "0", 10) : undefined;
  return { name, value, maxAge };
}

// All API responses follow { ok: true, data: T } or { ok: false, error: string }.
// apiFetch unwraps .data when present, so callers receive T directly.
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  // Forward Set-Cookie from API back to browser
  const setCookieHeaders: string[] =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie")].filter((v): v is string => v !== null);

  for (const header of setCookieHeaders) {
    const parsed = parseSetCookie(header);
    if (!parsed) continue;
    cookieStore.set(parsed.name, parsed.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
    });
  }

  const body = (await res.json()) as { ok?: boolean; data?: T; error?: string } & T;

  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  // Unwrap { ok: true, data: T } → T
  if (body.data !== undefined) return body.data as T;
  return body as T;
}

// ---------------------------------------------------------------------------
// Rooms (public)
// ---------------------------------------------------------------------------

export async function getRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms");
}

export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const rooms = await getRooms();
    return rooms.find((r) => r.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function getSlots(roomId: string, dateISO: string): Promise<Slot[]> {
  return apiFetch<Slot[]>(`/rooms/${roomId}/slots?date=${dateISO}`);
}

// ---------------------------------------------------------------------------
// Rooms (admin CRUD)
// ---------------------------------------------------------------------------

export async function getAllRoomsAdmin(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms/admin/all");
}

type RoomPayload = {
  name: string;
  slug: string;
  description: string;
  capacity: number;
  image_url?: string;
  location?: string;
};

export async function createRoomApi(payload: RoomPayload): Promise<Room> {
  return apiFetch<Room>("/rooms/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRoomApi(id: string, payload: Partial<RoomPayload>): Promise<Room> {
  return apiFetch<Room>(`/rooms/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function toggleRoomActiveApi(id: string): Promise<Room> {
  return apiFetch<Room>(`/rooms/admin/${id}/toggle`, { method: "PATCH" });
}

// ---------------------------------------------------------------------------
// Reservations (customer)
// ---------------------------------------------------------------------------

type CreateReservationPayload = {
  room_id: string;
  date: string;
  slot_starts: string[];
  people_count: number;
};

export type CreatedReservation = {
  id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  company_name: string;
  people_count: number;
};

export async function createReservationApi(
  payload: CreateReservationPayload
): Promise<CreatedReservation> {
  return apiFetch<CreatedReservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyReservations(): Promise<ReservationWithRoom[]> {
  return apiFetch<ReservationWithRoom[]>("/reservations");
}

export async function cancelMyReservationApi(reservationId: string): Promise<void> {
  await apiFetch<unknown>(`/reservations/${reservationId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Auth (customer account)
// ---------------------------------------------------------------------------

export async function registerAccountApi(payload: {
  name: string;
  cpf: string;
  company_name: string;
  password: string;
}): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginAccountApi(payload: {
  cpf: string;
  password: string;
}): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutAccountApi(): Promise<void> {
  await apiFetch<unknown>("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>("/auth/me");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function adminLoginApi(username: string, password: string): Promise<{ username: string }> {
  return apiFetch<{ username: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function adminLogoutApi(): Promise<void> {
  await apiFetch<unknown>("/admin/logout", { method: "POST" });
}

export type AdminFilters = {
  date?: string;
  room_id?: string;
  status?: "confirmed" | "cancelled";
};

export async function getAdminReservations(filters: AdminFilters = {}): Promise<ReservationWithRoom[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.room_id) params.set("room_id", filters.room_id);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return apiFetch<ReservationWithRoom[]>(`/admin/reservations${qs ? `?${qs}` : ""}`);
}

export async function getDashboardMetricsApi(): Promise<{
  todayCount: number;
  todayMinutes: number;
  todaySelections: number;
  upcomingCount: number;
  cancelledCount: number;
  activeCount: number;
}> {
  return apiFetch("/admin/dashboard");
}

export async function getAdminUsersApi(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paginated<AdminUser>> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  const query = params.toString();
  return apiFetch<Paginated<AdminUser>>(`/admin/users${query ? `?${query}` : ""}`);
}

export async function getAdminUserApi(userId: string): Promise<AdminUserDetails> {
  return apiFetch<AdminUserDetails>(`/admin/users/${userId}`);
}

export async function getAdminUserReservationsApi(
  userId: string,
  filters: { page?: number; pageSize?: number; status?: "confirmed" | "cancelled" } = {}
): Promise<Paginated<ReservationWithRoom>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return apiFetch<Paginated<ReservationWithRoom>>(
    `/admin/users/${userId}/reservations${query ? `?${query}` : ""}`
  );
}

export async function resetAdminUserPasswordApi(
  userId: string,
  password: string
): Promise<void> {
  await apiFetch<unknown>(`/admin/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export type UsageReport = {
  from: string | null;
  to: string | null;
  summary: {
    totalReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    totalMinutesReserved: number;
    totalMinutesUsed: number;
    cancelledMinutes: number;
    totalSelections: number;
    confirmedSelections: number;
    averageMinutes: number;
  };
  byRoom: Array<{
    roomId: string;
    roomName: string;
    reservations: number;
    minutes: number;
    selections: number;
  }>;
  byDay: Array<{ date: string; reservations: number; minutes: number; selections: number }>;
  byHour: Array<{ startTime: string; reservations: number; minutes: number }>;
  byUser: Array<{
    userId: string | null;
    name: string;
    cpf: string | null;
    companyName: string;
    reservations: number;
    minutes: number;
    selections: number;
  }>;
};

export async function getUsageReportApi(filters: {
  from?: string;
  to?: string;
  room_id?: string;
} = {}): Promise<UsageReport> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.room_id) params.set("room_id", filters.room_id);
  const query = params.toString();
  return apiFetch<UsageReport>(`/admin/reports/usage${query ? `?${query}` : ""}`);
}

export async function cancelAdminReservationApi(reservationId: string): Promise<void> {
  await apiFetch<unknown>(`/admin/reservations/${reservationId}`, { method: "DELETE" });
}

export type { Reservation, ReservationWithRoom, Room, Slot };
