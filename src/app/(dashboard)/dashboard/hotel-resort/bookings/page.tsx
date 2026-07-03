import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { HotelResortBookingsClient } from "@/systems/hotel-resort/HotelResortBookingsClient";

export default async function HotelResortBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <HotelResortBookingsClient />
    </Suspense>
  );
}
