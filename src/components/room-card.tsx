"use client";

import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

export function RoomCard({
  room,
  selected,
  highlighted = false,
  onClick,
}: {
  room: Room;
  selected: boolean;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        selected
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-stone-200/70",
        highlighted && !selected && "border-brand-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-900">
              {room.name}
            </h3>
            {highlighted && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                Destaque
              </span>
            )}
          </div>
          <p className="mb-4 text-sm leading-relaxed text-stone-600">
            {room.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Users className="h-4 w-4" />
            <span>Até {room.capacity} pessoas</span>
          </div>
        </div>
        <ArrowRight
          className={cn(
            "h-5 w-5 shrink-0 text-stone-400 transition-all group-hover:translate-x-0.5",
            selected && "text-brand-600"
          )}
        />
      </div>
    </button>
  );
}
