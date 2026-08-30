import { redirect } from "next/navigation";
import { parkingDashboardHref } from "@/systems/parking/parking-module-nav";

export default function ParkingSpotsIndexRedirect() {
  redirect(parkingDashboardHref("checkin"));
}
