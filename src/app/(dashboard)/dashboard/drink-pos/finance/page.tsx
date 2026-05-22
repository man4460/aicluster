import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DrinkPosSalesClient } from "@/systems/drink-pos/DrinkPosSalesClient";

export default async function DrinkPosFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DrinkPosSalesClient />
    </Suspense>
  );
}
