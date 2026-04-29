import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Reservation, ReservationWithRoom, Room } from "@/types";

// ---------------------------------------------------------------------------
// Local file-based store. Zero infra. Persists in `data/db.json`.
// Concurrency: a process-wide async mutex serializes reads/writes.
// ---------------------------------------------------------------------------

type DB = {
  rooms: Room[];
  reservations: Reservation[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const SEED_ROOMS: Room[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Sala Principal",
    slug: "sala-principal",
    description:
      "Espaço ideal para reuniões maiores, apresentações e encontros estratégicos.",
    capacity: 12,
    is_active: true,
    created_at: new Date(0).toISOString(),
    image_url: "/sala-principal.jpeg",
    location: "Bloco A · Piso 2",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Sala Secundária",
    slug: "sala-secundaria",
    description:
      "Espaço ideal para reuniões menores, atendimentos e conversas rápidas.",
    capacity: 6,
    is_active: true,
    created_at: new Date(1).toISOString(),
    image_url: "/sala-secundaria.jpeg",
    location: "Bloco A · Piso 1",
  },
];

let mutex: Promise<unknown> = Promise.resolve();
function lock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = mutex;
  let release!: () => void;
  mutex = new Promise<void>((res) => (release = res));
  return prev.then(fn).finally(() => release());
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const initial: DB = { rooms: SEED_ROOMS, reservations: [] };
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2));
  }
}

async function readDB(): Promise<DB> {
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, "utf8");
  const parsed = JSON.parse(raw) as DB;
  if (!parsed.rooms || parsed.rooms.length === 0) {
    parsed.rooms = SEED_ROOMS;
    await fs.writeFile(DB_FILE, JSON.stringify(parsed, null, 2));
  }
  return parsed;
}

async function writeDB(db: DB): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listRooms(): Promise<Room[]> {
  return lock(async () => {
    const db = await readDB();
    return db.rooms.filter((r) => r.is_active);
  });
}

export async function getRoom(id: string): Promise<Room | null> {
  return lock(async () => {
    const db = await readDB();
    return db.rooms.find((r) => r.id === id && r.is_active) ?? null;
  });
}

export async function getTakenStartTimes(
  roomId: string,
  dateISO: string
): Promise<string[]> {
  return lock(async () => {
    const db = await readDB();
    return db.reservations
      .filter(
        (r) =>
          r.room_id === roomId &&
          r.reservation_date === dateISO &&
          r.status === "confirmed"
      )
      .map((r) => r.start_time.slice(0, 5));
  });
}

export type TakenSlotInfo = {
  startTime: string;
  customerName: string;
  companyName: string;
};

export async function getTakenSlotsWithNames(
  roomId: string,
  dateISO: string
): Promise<TakenSlotInfo[]> {
  return lock(async () => {
    const db = await readDB();
    return db.reservations
      .filter(
        (r) =>
          r.room_id === roomId &&
          r.reservation_date === dateISO &&
          r.status === "confirmed"
      )
      .map((r) => ({
        startTime: r.start_time.slice(0, 5),
        customerName: r.customer_name,
        companyName: r.company_name,
      }));
  });
}

export type CreateInput = Omit<
  Reservation,
  | "id"
  | "status"
  | "created_at"
  | "cancelled_at"
  | "cancelled_by"
>;

export async function createReservationRecord(
  input: CreateInput
): Promise<{ ok: true; data: Reservation } | { ok: false; conflict: true }> {
  return lock(async () => {
    const db = await readDB();
    const conflict = db.reservations.find(
      (r) =>
        r.room_id === input.room_id &&
        r.reservation_date === input.reservation_date &&
        r.start_time === input.start_time &&
        r.status === "confirmed"
    );
    if (conflict) return { ok: false, conflict: true } as const;

    const reservation: Reservation = {
      ...input,
      id: randomUUID(),
      status: "confirmed",
      created_at: new Date().toISOString(),
      cancelled_at: null,
      cancelled_by: null,
    };
    db.reservations.push(reservation);
    await writeDB(db);
    return { ok: true, data: reservation } as const;
  });
}

export async function cancelReservationRecord(
  id: string,
  cancelledBy: string
): Promise<{ ok: true } | { ok: false; reason: "not_found" | "already_cancelled" }> {
  return lock(async () => {
    const db = await readDB();
    const idx = db.reservations.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false, reason: "not_found" } as const;
    const r = db.reservations[idx];
    if (r.status !== "confirmed")
      return { ok: false, reason: "already_cancelled" } as const;
    r.status = "cancelled";
    r.cancelled_at = new Date().toISOString();
    r.cancelled_by = cancelledBy;
    db.reservations[idx] = r;
    await writeDB(db);
    return { ok: true } as const;
  });
}

export type ListFilters = {
  date?: string;
  room_id?: string;
  status?: "confirmed" | "cancelled";
};

export async function listReservationsRecord(
  filters: ListFilters
): Promise<ReservationWithRoom[]> {
  return lock(async () => {
    const db = await readDB();
    const roomById = new Map(db.rooms.map((r) => [r.id, r]));
    return db.reservations
      .filter((r) => {
        if (filters.date && r.reservation_date !== filters.date) return false;
        if (filters.room_id && r.room_id !== filters.room_id) return false;
        if (filters.status && r.status !== filters.status) return false;
        return true;
      })
      .map((r) => ({ ...r, room: roomById.get(r.room_id)! }))
      .filter((r) => r.room)
      .sort((a, b) => {
        if (a.reservation_date !== b.reservation_date) {
          return a.reservation_date < b.reservation_date ? 1 : -1;
        }
        return a.start_time.localeCompare(b.start_time);
      });
  });
}

export async function dashboardCounts(): Promise<{
  todayCount: number;
  upcomingCount: number;
  cancelledCount: number;
  activeCount: number;
}> {
  return lock(async () => {
    const db = await readDB();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
      today.getDate()
    )}`;

    let todayCount = 0;
    let upcomingCount = 0;
    let cancelledCount = 0;
    let activeCount = 0;
    for (const r of db.reservations) {
      if (r.status === "cancelled") {
        cancelledCount++;
        continue;
      }
      activeCount++;
      if (r.reservation_date === todayISO) todayCount++;
      else if (r.reservation_date > todayISO) upcomingCount++;
    }
    return { todayCount, upcomingCount, cancelledCount, activeCount };
  });
}
