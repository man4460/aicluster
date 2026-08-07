import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { prisma } from "@/lib/prisma";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosStationBoardClient } from "@/systems/building-pos/BuildingPosStationBoardClient";

export const metadata: Metadata = {
  title: "แผนกครัว | POS ร้านอาหาร",
};

export default async function BuildingPosKitchenDepartmentStationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string; departmentId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { ownerId, departmentId: deptRaw } = await params;
  const sp = await searchParams;
  if (!ownerId || ownerId.length < 10) notFound();
  const departmentId = Number(deptRaw);
  if (!Number.isFinite(departmentId) || departmentId <= 0) notFound();

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const trialParam = sp.t?.trim() || null;
  const scope = await getBuildingPosDataScope(ownerId);
  const trialSessionId = trialParam && trialParam.length > 0 ? trialParam : scope.trialSessionId;

  const dept = await prisma.buildingPosKitchenDepartment.findFirst({
    where: {
      id: departmentId,
      ownerUserId: ownerId,
      trialSessionId,
      isActive: true,
    },
    select: { id: true, name: true },
  });
  if (!dept) notFound();

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8] px-1.5 py-1.5 sm:px-3 sm:py-3 md:px-4 md:py-4">
      <BuildingPosStationBoardClient
        className="min-h-0 w-full flex-1"
        role="kitchen"
        ownerId={ownerId}
        trialParam={trialParam}
        departmentId={dept.id}
        departmentName={dept.name}
      />
    </div>
  );
}
