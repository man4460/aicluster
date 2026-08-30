import { redirect } from "next/navigation";
import { parkingDashboardHref } from "@/systems/parking/parking-module-nav";

/** @deprecated ใช้ /dashboard/parking?tab=booking */
export default function ParkingBookingsRedirect() {
  redirect(parkingDashboardHref("booking"));
}
