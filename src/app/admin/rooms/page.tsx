import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAllRoomsAdmin } from "@/server/actions/rooms";
import { RoomsClient } from "./rooms-client";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("adapta_admin")) {
    redirect("/admin/login");
  }

  const rooms = await getAllRoomsAdmin();

  return <RoomsClient rooms={rooms} />;
}
