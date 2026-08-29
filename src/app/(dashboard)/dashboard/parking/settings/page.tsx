import type { Metadata } from "next";
import { ParkingPageStack } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingSettingsClient } from "@/systems/parking/components/ParkingSettingsClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่าลานจอด | บริการรับฝากจอดรถ",
};

export default async function ParkingSettingsPage() {
  const { site } = await requireParkingPage();

  return (
    <ParkingPageStack>
      <ParkingSettingsClient
        initialName={site.name}
        initialMode={site.pricingMode}
        initialHourly={site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null}
        initialDaily={site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null}
      />
    </ParkingPageStack>
  );
}
