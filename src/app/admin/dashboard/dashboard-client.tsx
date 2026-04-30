"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  DoorOpen,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/metric-card";
import { AdminFilters } from "@/components/admin/filters";
import { ReservationCard } from "@/components/admin/reservation-card";
import { ReservationTable } from "@/components/admin/reservation-table";
import { CancelReservationModal } from "@/components/admin/cancel-modal";
import { signOutAdmin } from "@/server/actions/admin";
import type { ReservationWithRoom, Room } from "@/types";

export function DashboardClient({
  metrics,
  reservations,
  rooms,
  initialFilters,
}: {
  metrics: {
    todayCount: number;
    upcomingCount: number;
    cancelledCount: number;
    activeCount: number;
  };
  reservations: ReservationWithRoom[];
  rooms: Room[];
  initialFilters: {
    date?: string;
    room_id?: string;
    status?: "confirmed" | "cancelled";
  };
}) {
  const router = useRouter();
  const [target, setTarget] = useState<ReservationWithRoom | null>(null);
  const [open, setOpen] = useState(false);

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
              <p className="text-sm font-semibold text-stone-900">
                Adapta Offices
              </p>
              <p className="text-xs text-stone-500">Painel administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/rooms">
                <DoorOpen className="mr-2 h-4 w-4" />
                Salas
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
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Reservas</h1>
          <p className="text-sm text-stone-500">
            Acompanhe e gerencie todas as reservas das salas.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Hoje"
            value={metrics.todayCount}
            icon={CalendarCheck2}
            tone="brand"
          />
          <MetricCard
            label="Próximas"
            value={metrics.upcomingCount}
            icon={CalendarClock}
            tone="amber"
          />
          <MetricCard
            label="Ativas"
            value={metrics.activeCount}
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            label="Canceladas"
            value={metrics.cancelledCount}
            icon={CalendarX2}
            tone="stone"
          />
        </div>

        <AdminFilters rooms={rooms} initial={initialFilters} />

        {reservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-sm text-stone-500">
            Nenhuma reserva encontrada com os filtros atuais.
          </div>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {reservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onCancel={(rr) => {
                    setTarget(rr);
                    setOpen(true);
                  }}
                />
              ))}
            </div>

            <ReservationTable
              reservations={reservations}
              onCancel={(rr) => {
                setTarget(rr);
                setOpen(true);
              }}
            />
          </>
        )}
      </main>

      <CancelReservationModal
        reservation={target}
        open={open}
        onOpenChange={setOpen}
        onCancelled={() => router.refresh()}
      />
    </div>
  );
}
