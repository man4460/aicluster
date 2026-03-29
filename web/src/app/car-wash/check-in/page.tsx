import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CarWashCustomerPortalClient } from "@/systems/car-wash/CarWashCustomerPortalClient";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export default async function CarWashCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; trialSessionId?: string; ownerId?: string }>;
}) {
  const sp = await searchParams;
  const ownerIdFromQuery = sp.ownerId?.trim() ?? "";
  if (ownerIdFromQuery) {
    const params = new URLSearchParams();
    if (sp.t?.trim()) params.set("t", sp.t.trim());
    else if (sp.trialSessionId?.trim()) params.set("trialSessionId", sp.trialSessionId.trim());
    const q = params.toString();
    redirect(`/car-wash/check-in/${ownerIdFromQuery}${q ? `?${q}` : ""}`);
  }

  const session = await getSession();
  if (session?.sub) {
    const params = new URLSearchParams();
    if (sp.t?.trim()) params.set("t", sp.t.trim());
    else if (sp.trialSessionId?.trim()) params.set("trialSessionId", sp.trialSessionId.trim());
    const q = params.toString();
    redirect(`/car-wash/check-in/${session.sub}${q ? `?${q}` : ""}`);
  }

  const t = sp.t?.trim() ?? sp.trialSessionId?.trim() ?? "";
  const trialSessionId = t || TRIAL_PROD_SCOPE;
  return <CarWashCustomerPortalClient trialSessionId={trialSessionId} />;
}

