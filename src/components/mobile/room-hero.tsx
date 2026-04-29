"use client";

import { MapPin, Sparkles, Users } from "lucide-react";
import type { Room } from "@/types";

export function RoomHero({ room }: { room: Room }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand-200/60 bg-white shadow-soft-lg animate-slide-up">
      <div className="relative h-48 w-full overflow-hidden bg-brand-200 sm:h-60">
        {room.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.image_url}
            alt={room.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-white/80">
            <Users className="h-12 w-12" />
          </div>
        )}
        {/* Vinheta inferior — destaca o título */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-stone-950/65 via-stone-950/15 to-transparent"
        />
        {/* Pill eyebrow */}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm backdrop-blur">
          <Sparkles className="h-3 w-3" />
          Reservar agora
        </span>
        {/* Title overlay */}
        <h2 className="absolute inset-x-5 bottom-4 font-display text-3xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-4xl">
          {room.name}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-4">
        {room.location && (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <MapPin className="h-3.5 w-3.5" />
            {room.location}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Users className="h-3.5 w-3.5" />
          Até {room.capacity} pessoas
        </span>
      </div>
    </div>
  );
}
