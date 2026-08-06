import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BuildingPosOrdersClient } from "@/systems/building-pos/BuildingPosOrdersClient";

export default async function BuildingPosOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <BuildingPosOrdersClient />
    </Suspense>
  );
}
