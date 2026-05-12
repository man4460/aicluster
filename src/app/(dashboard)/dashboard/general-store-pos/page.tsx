import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { GeneralStorePosDashboardClient } from "@/systems/general-store-pos/GeneralStorePosDashboardClient";

export default async function GeneralStorePosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <GeneralStorePosDashboardClient />
    </Suspense>
  );
}
