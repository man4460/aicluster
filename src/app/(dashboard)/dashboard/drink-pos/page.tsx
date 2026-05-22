import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DrinkPosDashboardClient } from "@/systems/drink-pos/DrinkPosDashboardClient";

export default async function DrinkPosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DrinkPosDashboardClient />
    </Suspense>
  );
}
