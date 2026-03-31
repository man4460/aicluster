import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export default async function BuildingPosOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; trialSessionId?: string; ownerId?: string; table?: string }>;
}) {
  const sp = await searchParams;
  const ownerIdFromQuery = sp.ownerId?.trim() ?? "";
  if (ownerIdFromQuery) {
    const params = new URLSearchParams();
    if (sp.t?.trim()) params.set("t", sp.t.trim());
    else if (sp.trialSessionId?.trim()) params.set("trialSessionId", sp.trialSessionId.trim());
    if (sp.table?.trim()) params.set("table", sp.table.trim());
    const q = params.toString();
    redirect(`/building-pos/order/${ownerIdFromQuery}${q ? `?${q}` : ""}`);
  }
  const session = await getSession();
  if (session?.sub) {
    const params = new URLSearchParams();
    if (sp.t?.trim()) params.set("t", sp.t.trim());
    else if (sp.trialSessionId?.trim()) params.set("trialSessionId", sp.trialSessionId.trim());
    if (sp.table?.trim()) params.set("table", sp.table.trim());
    const q = params.toString();
    redirect(`/building-pos/order/${session.sub}${q ? `?${q}` : ""}`);
  }
  const t = sp.t?.trim() ?? sp.trialSessionId?.trim() ?? "";
  const trialSessionId = t || TRIAL_PROD_SCOPE;
  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 pt-10 text-center">
      <h1 className="text-lg font-semibold text-slate-900">สั่งอาหารผ่าน QR</h1>
      <p className="text-sm text-slate-600">
        กรุณาเปิดลิงก์จาก QR ของร้าน หรือใส่ <code>ownerId</code> ใน URL
      </p>
      <p className="text-xs text-slate-500">trial: {trialSessionId}</p>
    </div>
  );
}
