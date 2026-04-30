"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogOut, MapPin, Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOutAdmin } from "@/server/actions/admin";
import { toggleRoomActive } from "@/server/actions/rooms";
import { RoomFormModal } from "./room-form-modal";
import type { Room } from "@/types";

export function RoomsClient({ rooms: initial }: { rooms: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [toggling, startToggle] = useTransition();

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditTarget(room);
    setModalOpen(true);
  }

  function handleSaved(room: Room) {
    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === room.id);
      if (idx === -1) return [...prev, room];
      const next = [...prev];
      next[idx] = room;
      return next;
    });
  }

  function handleToggle(room: Room) {
    startToggle(async () => {
      const res = await toggleRoomActive(room.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setRooms((prev) => prev.map((r) => (r.id === room.id ? res.data : r)));
      toast.success(res.data.is_active ? "Sala reativada." : "Sala desativada.");
    });
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.gif"
              alt="Adapta Offices"
              width={36}
              height={45}
              className="rounded-md"
            />
            <div>
              <p className="text-sm font-semibold text-stone-900">Adapta Offices</p>
              <p className="text-xs text-stone-500">Gestão de salas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <form action={signOutAdmin}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Salas</h1>
            <p className="text-sm text-stone-500">
              Crie, edite e gerencie as salas disponíveis para reserva.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar sala
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-500">
            Nenhuma sala cadastrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                  {room.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.image_url}
                      alt={room.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-400">
                      <Users className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-stone-900">{room.name}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        room.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {room.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.capacity} pessoas
                    </span>
                    {room.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {room.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(room)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant={room.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggle(room)}
                    disabled={toggling}
                  >
                    {room.is_active ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <RoomFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        room={editTarget}
        onSaved={(room) => {
          handleSaved(room);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

