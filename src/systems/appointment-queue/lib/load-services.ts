import { prisma } from "@/lib/prisma";

export type AppointmentQueueServiceRow = {
  id: number;
  name: string;
  durationMinutes: number;
  priceBaht: number | null;
  isActive: boolean;
};

export async function loadAppointmentQueueServices(
  ownerUserId: string,
  trialSessionId: string,
): Promise<AppointmentQueueServiceRow[]> {
  const rows = await prisma.appointmentQueueService.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    durationMinutes: r.durationMinutes,
    priceBaht: r.priceBaht != null ? Number(r.priceBaht) : null,
    isActive: r.isActive,
  }));
}
