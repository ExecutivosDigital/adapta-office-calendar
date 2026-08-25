export type Room = {
  id: string;
  name: string;
  slug: string;
  description: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  image_url?: string;
  location?: string;
};

export type ReservationStatus = "confirmed" | "cancelled";

export type Reservation = {
  id: string;
  room_id: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string | null;
  company_name: string;
  people_count: number;
  slot_count: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancelled_by_user_id?: string | null;
  user?: UserSummary | null;
  cancelledByUser?: UserSummary | null;
};

export type ReservationWithRoom = Reservation & { room: Room };

export type SlotStatus = "available" | "unavailable" | "past";

export type Slot = {
  baseStart: string;
  start: string;
  end: string;
  status: SlotStatus;
  bookedBy?: string | null;
  bookedCompany?: string | null;
};

export type CurrentUser = {
  id: string;
  name: string;
  cpf: string;
  company_name: string;
};

export type UserSummary = {
  id: string;
  name: string;
  cpf: string | null;
  company_name: string | null;
  phone?: string | null;
};

export type AdminUser = UserSummary & {
  created_at: string;
  updated_at: string;
  hasPassword: boolean;
  reservationCount: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUserDetails = UserSummary & {
  created_at: string;
  updated_at: string;
  hasPassword: boolean;
  summary: {
    totalReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    totalMinutesReserved: number;
    totalMinutesUsed: number;
    cancelledMinutes: number;
    totalSelections: number;
    confirmedSelections: number;
  };
};

// ── Painel de porta (display) ───────────────────────────────────────────────

export type DisplayEntry = {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  company_name: string;
  customer_name: string;
  people_count: number;
  state: "running" | "upcoming" | "done";
};

export type DisplayRoom = {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  location: string | null;
  status: "occupied" | "free" | "closed";
  current: DisplayEntry | null;
  next: DisplayEntry | null;
  freeUntil: string | null;
  target: { time: string; kind: "end" | "start" } | null;
  reservations: DisplayEntry[];
};

export type DisplayPayload = {
  date: string;
  serverTime: { iso: string; dateISO: string; time: string; minutes: number };
  business: {
    opening: string;
    closing: string;
    slotMinutes: number;
    timezone: string;
    openToday: boolean;
  };
  rooms: DisplayRoom[];
};
