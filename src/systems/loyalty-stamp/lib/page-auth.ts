import { redirect, unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getLoyaltyStampDataScope } from "@/lib/trial/module-scopes";
import { requireLoyaltyStampSection } from "@/systems/loyalty-stamp/lib/guard";
import { ensureLoyaltyStampProfile } from "@/systems/loyalty-stamp/lib/ensure-profile";

export async function requireLoyaltyStampPage() {
  try {
    await requireLoyaltyStampSection();
  } catch (e) {
    unstable_rethrow(e);
    redirect("/dashboard/modules");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getLoyaltyStampDataScope(session.sub);
  const profile = await ensureLoyaltyStampProfile(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile };
}
