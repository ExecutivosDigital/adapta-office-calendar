import { getMyReservations } from "@/lib/api-client";
import { ReservasClient } from "./reservas-client";
import type { ReservationWithRoom } from "@/types";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Minhas reservas · Adapta Offices",
};

export default async function ReservasPage() {
  let reservations: ReservationWithRoom[] = [];
  try {
    reservations = await getMyReservations();
  } catch {
    redirect("/login?returnUrl=/reservas");
  }

  return <ReservasClient initialReservations={reservations} />;
}
