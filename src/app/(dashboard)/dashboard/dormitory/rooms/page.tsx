import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { DormRoomManageHeaderActions } from "@/systems/dormitory/components/DormRoomManageHeaderActions";
import { DormRoomManagePanel } from "@/systems/dormitory/components/DormRoomManagePanel";
import { buildRoomComputeInput, roomBillingUiStatus } from "@/systems/dormitory/lib/compute";

export default async function DormitoryRoomsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getDormitoryDataScope(session.sub);
  const rooms = await prisma.room.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    include: {
      tenants: true,
      utilityBills: {
        include: { payments: true },
      },
    },
  });

  const rows = rooms.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    floor: r.floor,
    roomType: r.roomType,
    basePrice: Number(r.basePrice),
    maxOccupants: r.maxOccupants,
    activeTenants: r.tenants.filter((t) => t.status === "ACTIVE").length,
    billingStatus: roomBillingUiStatus(buildRoomComputeInput(r)),
  }));

  return (
    <DormPageStack>
      <DormPanelCard
        title="การจัดการ"
        description="จัดการห้องพัก มิเตอร์ และการชำระ"
        action={<DormRoomManageHeaderActions />}
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
      >
        <DormRoomManagePanel rooms={rows} />
      </DormPanelCard>
    </DormPageStack>
  );
}
