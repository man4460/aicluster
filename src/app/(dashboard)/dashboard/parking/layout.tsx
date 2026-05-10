import { ParkingValetShell } from "@/systems/parking/components/ParkingValetShell";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export default async function ParkingModuleLayout({ children }: { children: React.ReactNode }) {
  const { site } = await requireParkingPage();
  return <ParkingValetShell siteName={site.name}>{children}</ParkingValetShell>;
}
