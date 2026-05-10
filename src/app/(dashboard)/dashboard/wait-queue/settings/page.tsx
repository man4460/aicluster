import type { Metadata } from "next";
import { WaitQueueSettingsClient } from "@/systems/wait-queue/components/WaitQueueSettingsClient";
import { requireWaitQueuePage } from "@/systems/wait-queue/lib/wait-queue-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่าคิวหน้าร้าน | MAWELL",
};

export default async function WaitQueueSettingsPage() {
  const { site } = await requireWaitQueuePage();
  return <WaitQueueSettingsClient name={site.name} callMessage={site.callMessage} />;
}
