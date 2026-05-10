import type { Metadata } from "next";
import { WaitQueueDashboardClient } from "@/systems/wait-queue/components/WaitQueueDashboardClient";
import {
  buildWaitQueueDashboardDto,
  loadWaitQueueDashboardPayload,
} from "@/systems/wait-queue/lib/load-dashboard";
import { requireWaitQueuePage } from "@/systems/wait-queue/lib/wait-queue-page-auth";

export const metadata: Metadata = {
  title: "คิวหน้าร้าน | MAWELL",
};

export default async function WaitQueueDashboardPage() {
  const { site } = await requireWaitQueuePage();
  const payload = await loadWaitQueueDashboardPayload(site.id);
  const initial = buildWaitQueueDashboardDto(site, payload);
  return <WaitQueueDashboardClient initial={initial} />;
}
