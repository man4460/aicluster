import { notFound } from "next/navigation";
import { FOOTBALL_TURF_MODULE_SLUG } from "@/lib/modules/config";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { FootballTurfCheckInClient } from "@/systems/football-turf/FootballTurfCheckInClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
};

export default async function FootballTurfCheckInPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, FOOTBALL_TURF_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || sp.trialSessionId?.trim() || scope.trialSessionId;

  return (
    <FootballTurfCheckInClient ownerId={ownerId} trialSessionId={trialSessionId} />
  );
}
