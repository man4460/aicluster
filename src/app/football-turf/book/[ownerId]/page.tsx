import { notFound } from "next/navigation";
import { FootballTurfBookingPortalClient } from "@/systems/football-turf/FootballTurfBookingPortalClient";

export default async function FootballTurfBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  if (!ownerId) notFound();
  return (
    <FootballTurfBookingPortalClient
      ownerId={ownerId}
      trialSessionId={sp.t?.trim() ?? sp.trialSessionId?.trim() ?? ""}
    />
  );
}
