import { requireBuildingPosSection } from "@/systems/building-pos/lib/guard";
import { BuildingPosShell } from "@/systems/building-pos/components/BuildingPosShell";

export default async function BuildingPosLayout({ children }: { children: React.ReactNode }) {
  await requireBuildingPosSection();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BuildingPosShell>{children}</BuildingPosShell>
    </div>
  );
}
