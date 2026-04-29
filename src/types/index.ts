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
  customer_name: string;
  customer_phone: string;
  company_name: string;
  people_count: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
};

export type ReservationWithRoom = Reservation & { room: Room };

export type SlotStatus = "available" | "unavailable" | "past";

export type Slot = {
  start: string;
  end: string;
  status: SlotStatus;
  bookedBy?: string;
};
