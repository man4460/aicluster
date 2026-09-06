import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import {
  mapClubEventProfile,
  mapClubEventRecord,
  parseCommitteeJson,
  parseDynamicLinkConfig,
  type ClubCommitteeMember,
  type ClubEventProfileDto,
  type ClubEventRecordDto,
  type ClubEventDynamicLinkDto,
} from "@/systems/club-event/lib/mappers";

export type ClubPublicPortalLink = {
  id: string;
  type: ClubEventDynamicLinkDto["type"];
  title: string;
  config: ReturnType<typeof parseDynamicLinkConfig>;
  publicPath: string;
};

export type ClubPublicPortalEvent = ClubEventRecordDto & {
  /** รูปปกจากแกลเลอรีกิจกรรม (ใบแรก) */
  coverImageUrl: string | null;
  galleryPreview: { id: string; imageUrl: string; fileName: string }[];
};

export type ClubPublicPortalPayload = {
  profile: ClubEventProfileDto;
  committee: ClubCommitteeMember[];
  upcomingEvents: ClubPublicPortalEvent[];
  pastEvents: ClubPublicPortalEvent[];
  /** รูปจากแกลเลอรีกิจกรรมย้อนหลัง — รวมเข้าแกลเลอรีพอร์ทัล */
  pastEventGalleryUrls: string[];
  links: ClubPublicPortalLink[];
  /** ลิงก์ที่ไม่มี eventId — แสดงใต้กฎระเบียบ */
  standaloneLinks: ClubPublicPortalLink[];
};

function mapPortalEvent(
  e: Parameters<typeof mapClubEventRecord>[0] & {
    gallery?: { id: string; imageUrl: string; fileName: string }[];
  },
): ClubPublicPortalEvent {
  const galleryPreview = (e.gallery ?? []).map((g) => ({
    id: g.id,
    imageUrl: g.imageUrl,
    fileName: g.fileName,
  }));
  return {
    ...mapClubEventRecord(e),
    coverImageUrl: galleryPreview[0]?.imageUrl ?? null,
    galleryPreview,
  };
}

/** โหลดพอร์ทัลสาธารณะชมรม — ใช้ทั้งหน้า SSR และ API */
export async function loadClubEventPublicPortal(
  slug: string,
  trialParam: string | null = null,
): Promise<ClubPublicPortalPayload | null> {
  const profile = await findClubEventPublicProfile(slug, trialParam);
  if (!profile) return null;

  const [upcoming, past, links] = await Promise.all([
    prisma.clubEventRecord.findMany({
      where: { profileId: profile.id, status: "UPCOMING" },
      orderBy: { eventDate: "asc" },
      include: {
        _count: { select: { gallery: true } },
        gallery: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 20,
    }),
    prisma.clubEventRecord.findMany({
      where: { profileId: profile.id, status: "PAST" },
      orderBy: { eventDate: "desc" },
      include: {
        _count: { select: { gallery: true } },
        gallery: { orderBy: { sortOrder: "asc" }, take: 8 },
      },
      take: 12,
    }),
    prisma.clubEventDynamicLink.findMany({
      where: { profileId: profile.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mappedLinks: ClubPublicPortalLink[] = links.map((l) => ({
    id: l.id,
    type: l.type,
    title: l.title,
    config: parseDynamicLinkConfig(l.configJson),
    publicPath: `/club/${slug}/link/${l.id}`,
  }));

  const pastEvents = past.map(mapPortalEvent);
  const pastEventGalleryUrls: string[] = [];
  const seen = new Set<string>();
  for (const ev of pastEvents) {
    for (const g of ev.galleryPreview) {
      const url = g.imageUrl.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      pastEventGalleryUrls.push(url);
    }
  }

  return {
    profile: mapClubEventProfile(profile),
    committee: parseCommitteeJson(profile.committeeJson),
    upcomingEvents: upcoming.map(mapPortalEvent),
    pastEvents,
    pastEventGalleryUrls,
    links: mappedLinks,
    standaloneLinks: mappedLinks.filter((l) => !l.config.eventId?.trim()),
  };
}
