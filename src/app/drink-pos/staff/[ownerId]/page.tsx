import { notFound } from "next/navigation";
import { DrinkPosStaffClient } from "@/systems/drink-pos/DrinkPosStaffClient";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

export default async function DrinkPosStaffPage({
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
  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <DrinkPosStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />;
}
