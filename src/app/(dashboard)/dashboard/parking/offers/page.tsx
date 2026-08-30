import type { Metadata } from "next";
import { ParkingOffersClient } from "@/systems/parking/components/ParkingOffersClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "แพ็กเกจ | บริการรับฝากจอดรถ",
};

export default async function ParkingOffersPage() {
  await requireParkingPage();
  return <ParkingOffersClient />;
}
