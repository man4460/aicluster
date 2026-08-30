import { redirect } from "next/navigation";
import { parkingOffersHref } from "@/systems/parking/parking-module-nav";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

/** เดิมแยกหน้าลาน — รวมเข้าหน้าการจัดการแล้ว */
export default async function ParkingLotsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ lot?: string }>;
}) {
  await requireParkingPage();
  const sp = await searchParams;
  redirect(parkingOffersHref({ tab: "lots", lot: sp.lot }));
}
