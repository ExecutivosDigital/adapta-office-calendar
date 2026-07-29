import { getAllRoomsAdmin } from "@/server/actions/rooms";
import { getUsageReport } from "@/server/actions/admin";
import { UsageReportClient } from "./usage-report-client";

export const dynamic = "force-dynamic";

export default async function UsageReportPage() {
  const [rooms, report] = await Promise.all([getAllRoomsAdmin(), getUsageReport()]);
  return <UsageReportClient rooms={rooms} initialReport={report} />;
}
