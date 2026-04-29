"use server";

import {
  listRooms,
  getRoom,
  getTakenSlotsWithNames,
  type TakenSlotInfo,
} from "@/lib/store";
import type { Room } from "@/types";

export async function getRooms(): Promise<Room[]> {
  return listRooms();
}

export async function getRoomById(id: string): Promise<Room | null> {
  return getRoom(id);
}

export async function getTakenSlots(
  roomId: string,
  dateISO: string
): Promise<TakenSlotInfo[]> {
  return getTakenSlotsWithNames(roomId, dateISO);
}
