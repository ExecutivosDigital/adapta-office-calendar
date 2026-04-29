import { DashboardClient } from "./dashboard-client";
import { getRooms } from "@/server/actions/rooms";
import {
  getDashboardMetrics,
  listReservations,
} from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    room_id?: string;
    status?: "confirmed" | "cancelled";
  }>;
}) {
  const params = await searchParams;
  const filters = {
    date: params.date,
    room_id: params.room_id,
    status: params.status,
  };

  const [metrics, reservations, rooms] = await Promise.all([
    getDashboardMetrics(),
    listReservations(filters),
    getRooms(),
  ]);

  return (
    <DashboardClient
      metrics={metrics}
      reservations={reservations}
      rooms={rooms}
      initialFilters={filters}
    />
  );
}
