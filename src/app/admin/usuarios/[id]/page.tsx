import { getAdminUser, listAdminUserReservations } from "@/server/actions/admin";
import { UserHistoryClient } from "./user-history-client";

export const dynamic = "force-dynamic";

export default async function AdminUserHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: "confirmed" | "cancelled" }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const status = query.status;
  const [user, history] = await Promise.all([
    getAdminUser(id),
    listAdminUserReservations(id, { page, pageSize: 20, status }),
  ]);

  return <UserHistoryClient user={user} history={history} status={status} />;
}
