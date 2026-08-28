import { redirect } from "next/navigation";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export default async function DormStaffRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string; roomId: string }>;
  searchParams: Promise<{ t?: string; k?: string; month?: string; section?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  const staffKey = sp.k?.trim() ?? "";
  const roomId = p.roomId?.trim() ?? "";
  if (!ownerId || !staffKey || !roomId) redirect("/");

  const scope = await getDormitoryDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey, room: roomId });
  if (sp.month) qs.set("month", sp.month);
  if (sp.section) qs.set("section", sp.section);
  redirect(`/dorm/staff/${ownerId}?${qs.toString()}`);
}
