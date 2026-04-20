import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BuildingPosCostsClient } from "@/systems/building-pos/BuildingPosCostsClient";

export const metadata = {
  title: "ต้นทุน / รายจ่าย | POS ร้านอาหาร",
};

export default async function BuildingPosCostsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <BuildingPosCostsClient />
    </Suspense>
  );
}
