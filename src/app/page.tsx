import { ReservationFlow } from "@/components/reservation-flow";
import { getRooms } from "@/server/actions/rooms";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rooms = await getRooms();

  if (rooms.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-semibold">Nenhuma sala disponível</h1>
        <p className="mt-2 text-stone-500">
          Volte em breve. Se acredita que isso é um engano, contate o
          administrador.
        </p>
      </div>
    );
  }

  return <ReservationFlow rooms={rooms} />;
}
