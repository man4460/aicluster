import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppointmentQueuePortalOpenForOwner } from "@/lib/appointment-queue/portal-access";
import { AppointmentQueuePortalClient } from "@/systems/appointment-queue/components/AppointmentQueuePortalClient";

type Props = { params: Promise<{ ownerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ownerId } = await params;
  return { title: `จองคิว · ${ownerId.slice(0, 8)}…` };
}

export default async function AppointmentQueuePublicPage({ params }: Props) {
  const { ownerId } = await params;
  if (ownerId.length < 10) notFound();
  const open = await isAppointmentQueuePortalOpenForOwner(ownerId);
  if (!open) notFound();
  return <AppointmentQueuePortalClient ownerId={ownerId} />;
}
