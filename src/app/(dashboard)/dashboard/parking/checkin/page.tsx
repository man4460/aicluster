import { redirect } from "next/navigation";
import { parkingDashboardHref } from "@/systems/parking/parking-module-nav";

type Props = { searchParams: Promise<{ spot?: string }> };

/** @deprecated ใช้ /dashboard/parking?tab=checkin */
export default async function ParkingCheckInRedirect({ searchParams }: Props) {
  const { spot } = await searchParams;
  redirect(spot ? parkingDashboardHref("checkin", { spot }) : parkingDashboardHref("checkin"));
}
