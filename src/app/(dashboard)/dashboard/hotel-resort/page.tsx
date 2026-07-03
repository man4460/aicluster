import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { HotelResortDashboardClient } from "@/systems/hotel-resort/HotelResortDashboardClient";

export default async function HotelResortPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <HotelResortDashboardClient />
    </Suspense>
  );
}
