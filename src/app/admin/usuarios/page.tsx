import { listAdminUsers } from "@/server/actions/admin";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  return <UsersClient initialUsers={users} />;
}
