import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { DrinkPosOrdersClient } from "@/systems/drink-pos/DrinkPosOrdersClient";

export default async function DrinkPosOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DrinkPosOrdersClient />
    </Suspense>
  );
}
