import { requireBuildingPosSection } from "@/systems/building-pos/lib/guard";
import { BuildingPosShell } from "@/systems/building-pos/components/BuildingPosShell";

export default async function BuildingPosLayout({ children }: { children: React.ReactNode }) {
  await requireBuildingPosSection();
  return <BuildingPosShell>{children}</BuildingPosShell>;
}
