import { redirect } from "next/navigation";
import { parkingDashboardHref } from "@/systems/parking/parking-module-nav";

type Props = { params: Promise<{ id: string }> };

/** @deprecated ใช้ /dashboard/parking?tab=checkin&spot= */
export default async function ParkingSpotDetailRedirect({ params }: Props) {
  const id = (await params).id;
  redirect(parkingDashboardHref("checkin", { spot: id }));
}
