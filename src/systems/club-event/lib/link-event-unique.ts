import { prisma } from "@/lib/prisma";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";

/** หาลิงก์ที่ผูก eventId แล้ว (configJson) — กิจกรรมละ 1 ลิงก์ */
export async function findClubEventLinkIdByEventId(args: {
  profileId: string;
  ownerUserId: string;
  trialSessionId: string;
  eventId: string;
  excludeLinkId?: string;
}): Promise<string | null> {
  const rows = await prisma.clubEventDynamicLink.findMany({
    where: {
      profileId: args.profileId,
      ownerUserId: args.ownerUserId,
      trialSessionId: args.trialSessionId,
      ...(args.excludeLinkId ? { id: { not: args.excludeLinkId } } : {}),
    },
    select: { id: true, configJson: true },
  });
  for (const row of rows) {
    const cfg = parseDynamicLinkConfig(row.configJson);
    if (cfg.eventId === args.eventId) return row.id;
  }
  return null;
}

export function eventIdFromLinkConfigBody(config: unknown): string | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const eventId = (config as { eventId?: unknown }).eventId;
  return typeof eventId === "string" && eventId.trim() ? eventId.trim() : null;
}
