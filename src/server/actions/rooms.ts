"use server";

import {
  getRooms as getRoomsApi,
  getRoomById as getRoomByIdApi,
  getSlots,
  getAllRoomsAdmin as getAllRoomsAdminApi,
  createRoomApi,
  updateRoomApi,
  toggleRoomActiveApi,
} from "@/lib/api-client";
import type { Room } from "@/types";

export type TakenSlotInfo = {
  startTime: string;
  customerName: string;
  companyName: string;
};

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getRooms(): Promise<Room[]> {
  return getRoomsApi();
}

export async function getRoomById(id: string): Promise<Room | null> {
  return getRoomByIdApi(id);
}

export async function getTakenSlots(
  roomId: string,
  dateISO: string
): Promise<TakenSlotInfo[]> {
  const slots = await getSlots(roomId, dateISO);
  return slots
    .filter((s) => s.status === "unavailable")
    .map((s) => ({
      startTime: s.start,
      customerName: s.bookedBy ?? "",
      companyName: "",
    }));
}

export async function getAllRoomsAdmin(): Promise<Room[]> {
  return getAllRoomsAdminApi();
}

export async function createRoom(raw: unknown): Promise<ActionResult<Room>> {
  try {
    const payload = raw as Parameters<typeof createRoomApi>[0];
    const room = await createRoomApi(payload);
    return { ok: true, data: room };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao criar sala." };
  }
}

export async function updateRoom(
  id: string,
  raw: unknown
): Promise<ActionResult<Room>> {
  try {
    const payload = raw as Parameters<typeof updateRoomApi>[1];
    const room = await updateRoomApi(id, payload);
    return { ok: true, data: room };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao atualizar sala." };
  }
}

export async function toggleRoomActive(id: string): Promise<ActionResult<Room>> {
  try {
    const room = await toggleRoomActiveApi(id);
    return { ok: true, data: room };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao alterar status da sala." };
  }
}
