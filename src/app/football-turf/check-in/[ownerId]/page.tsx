import { notFound } from "next/navigation";
import { FootballTurfCheckInClient } from "@/systems/football-turf/FootballTurfCheckInClient";

export default async function FootballTurfCheckInPage({
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
    <FootballTurfCheckInClient
      ownerId={ownerId}
      trialSessionId={sp.t?.trim() ?? sp.trialSessionId?.trim() ?? ""}
    />
  );
}
