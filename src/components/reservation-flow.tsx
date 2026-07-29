"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { Header } from "./header";
import { ReservationModal } from "./reservation-modal";
import { SuccessState } from "./success-state";
import { MobileTopBar } from "./mobile/top-bar";
import { RoomHero } from "./mobile/room-hero";
import { MonthDateSelector } from "./mobile/month-date-selector";
import { PillSlots } from "./mobile/pill-slots";
import { SummaryBar } from "./mobile/summary-bar";
import { StickyCta } from "./mobile/sticky-cta";
import { getRoomSlots } from "@/server/actions/rooms";
import { todayISO } from "@/lib/time-slots";
import { cn } from "@/lib/utils";
import type { CurrentUser, Room, Slot } from "@/types";

type SuccessData = {
  reservation_id: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  companyName: string;
};

export function ReservationFlow({
  rooms,
  currentUser,
}: {
  rooms: Room[];
  currentUser: CurrentUser;
}) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  useEffect(() => {
    setSelectedSlotKeys([]);
    if (!selectedRoom) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    setLoadingSlots(true);

    async function refreshSlots() {
      try {
        const nextSlots = await getRoomSlots(selectedRoom!.id, date);
        if (cancelled) return;
        setSlots(nextSlots);
        setSelectedSlotKeys((selected) =>
          selected.filter((baseStart) =>
            nextSlots.some(
              (slot) =>
                slot.baseStart === baseStart && slot.status === "available"
            )
          )
        );
      } catch {
        // Mantém a última lista visível; a próxima atualização tenta novamente.
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    void refreshSlots();

    // Alinha a atualização à virada do minuto para o horário corrente, como
    // 12:43, mudar na tela exatamente quando o relógio passar para 12:44.
    const nextMinuteDelay = 60_000 - (Date.now() % 60_000) + 100;
    const timeoutId = setTimeout(() => {
      void refreshSlots();
      intervalId = setInterval(() => void refreshSlots(), 60_000);
    }, nextMinuteDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedRoom, date]);

  const selectedSlots = useMemo(
    () =>
      selectedSlotKeys
        .map((key) => slots.find((slot) => slot.baseStart === key))
        .filter((slot): slot is Slot => Boolean(slot)),
    [selectedSlotKeys, slots]
  );
  const selectedStartTime = selectedSlots[0]?.start ?? null;
  const selectedEndTime = selectedSlots.at(-1)?.end ?? null;

  function handleSlotSelect(baseStart: string) {
    setSelectedSlotKeys((selected) => {
      if (selected.includes(baseStart)) {
        return selected.filter((key) => key !== baseStart);
      }

      if (selected.length !== 1) return [baseStart];

      const firstIndex = slots.findIndex(
        (slot) => slot.baseStart === selected[0]
      );
      const nextIndex = slots.findIndex((slot) => slot.baseStart === baseStart);

      if (Math.abs(firstIndex - nextIndex) !== 1) {
        return [baseStart];
      }

      return firstIndex < nextIndex
        ? [selected[0], baseStart]
        : [baseStart, selected[0]];
    });
  }

  // -----------------------------------------------------------------------
  // SUCCESS SCREEN
  // -----------------------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <MobileTopBar
          title="RESERVA CONFIRMADA"
          onBack={() => {
            setSuccess(null);
            setSelectedRoom(null);
            setSelectedSlotKeys([]);
          }}
        />
        <main className="container py-8">
          <SuccessState
            reservationId={success.reservation_id}
            roomName={success.roomName}
            date={success.date}
            startTime={success.startTime}
            endTime={success.endTime}
            customerName={success.customerName}
            companyName={success.companyName}
            onNewReservation={() => {
              setSuccess(null);
              setSelectedRoom(null);
              setSelectedSlotKeys([]);
            }}
            onBackToHome={() => {
              setSuccess(null);
              setSelectedRoom(null);
              setSelectedSlotKeys([]);
            }}
            onCancelled={() => {
              setSuccess(null);
              setSelectedRoom(null);
              setSelectedSlotKeys([]);
            }}
          />
        </main>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // ROOM DETAIL (the screenshot reference layout)
  // -----------------------------------------------------------------------
  if (selectedRoom) {
    return (
      <div className="min-h-screen bg-cream">
        <MobileTopBar
          title="RESERVAR SALA"
          onBack={() => {
            setSelectedRoom(null);
            setSelectedSlotKeys([]);
          }}
        />

        <main className="container space-y-10 py-6 sm:space-y-12">
          <RoomHero room={selectedRoom} />

          <MonthDateSelector value={date} onChange={setDate} />

          <PillSlots
            slots={slots}
            selected={selectedSlotKeys}
            onSelect={handleSlotSelect}
            loading={loadingSlots}
          />

          <SummaryBar
            date={date}
            startTime={selectedStartTime}
            endTime={selectedEndTime}
          />
        </main>

        {/* Spacer so content above the sticky CTA never gets cut */}
        <div aria-hidden className="h-44" />

        <StickyCta
          label="Confirmar horário"
          disabled={selectedSlotKeys.length === 0}
          onClick={() => setModalOpen(true)}
        />

        <ReservationModal
          open={modalOpen}
          onOpenChange={(o) => setModalOpen(o)}
          room={selectedRoom}
          date={date}
          slotStarts={selectedSlotKeys}
          startTime={selectedStartTime}
          endTime={selectedEndTime}
          currentUser={currentUser}
          onSuccess={(data) => {
            setSuccess({
              reservation_id: data.id,
              roomName: selectedRoom.name,
              date,
              startTime: data.start_time,
              endTime: data.end_time,
              customerName: data.customer_name,
              companyName: data.company_name,
            });
            setSelectedSlotKeys([]);
            void getRoomSlots(selectedRoom.id, date).then(setSlots);
          }}
        />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // HOME — list of rooms (hero cards with photos)
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen">
      <Header subtitle="Agendamento de Salas" />
      <main className="container space-y-7 py-6 sm:py-10">
        <section className="space-y-2 animate-slide-up">
          <span className="eyebrow-pill">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Agendamento
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
            Escolha sua sala
          </h1>
          <p className="text-sm text-stone-600">
            Toque em uma sala para ver os horários disponíveis.
          </p>
        </section>

        <div className="space-y-4">
          {rooms.map((room, i) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoom(room)}
              className={cn(
                "group relative block w-full cursor-pointer overflow-hidden rounded-3xl border border-brand-200/70 bg-white text-left shadow-soft-lg",
                "transition-all duration-300 ease-out animate-slide-up",
                "hover:-translate-y-1.5 hover:border-brand-400/70 hover:shadow-brand-glow",
                "active:translate-y-0 active:shadow-md",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30",
                i === 0 ? "stagger-1" : i === 1 ? "stagger-2" : "stagger-3"
              )}
            >
              <div className="relative h-48 w-full overflow-hidden bg-brand-200">
                {room.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-white/80">
                    <Users className="h-12 w-12" />
                  </div>
                )}
                {/* Vinheta inferior permanente — destaca o título */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-stone-950/70 via-stone-950/15 to-transparent"
                />
                {/* Pill canto superior */}
                {i === 0 ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-brand-glow">
                    Destaque
                  </span>
                ) : (
                  <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 shadow-sm backdrop-blur">
                    Disponível
                  </span>
                )}
                {/* Capacidade canto superior direito */}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-stone-950/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  <Users className="h-3 w-3" />
                  {room.capacity}
                </span>
                {/* Title overlay */}
                <h2 className="absolute inset-x-4 bottom-3 font-display text-2xl font-extrabold leading-tight text-white drop-shadow-lg">
                  {room.name}
                </h2>
              </div>
              <div className="space-y-2 p-5">
                <p className="text-sm text-stone-600">{room.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {room.location ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                      <MapPin className="h-3.5 w-3.5" />
                      {room.location}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 transition-all group-hover:bg-brand-gradient group-hover:text-white group-hover:shadow-brand-glow">
                    Reservar
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

// Keep next/image import compatible even though we use plain <img>.
void Image;
