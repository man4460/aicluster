import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FootballTurfStaffClient } from "@/systems/football-turf/FootballTurfStaffClient";
import { getFootballTurfDataScope } from "@/lib/trial/module-scopes";

export default async function FootballTurfStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; k?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  const staffKey = sp.k?.trim() ?? "";
  if (!ownerId || ownerId.length < 10 || !staffKey) notFound();
  const scope = await getFootballTurfDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return (
    <Suspense fallback={<p className="p-6 text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>}>
      <FootballTurfStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />
    </Suspense>
  );
}
