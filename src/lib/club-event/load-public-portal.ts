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

export type ClubPublicPortalPayload = {
  profile: ClubEventProfileDto;
  committee: ClubCommitteeMember[];
  upcomingEvents: ClubEventRecordDto[];
  pastEvents: Array<
    ClubEventRecordDto & {
      galleryPreview: { id: string; imageUrl: string; fileName: string }[];
    }
  >;
  links: ClubPublicPortalLink[];
  /** ลิงก์ที่ไม่มี eventId — แสดงใต้กฎระเบียบ */
  standaloneLinks: ClubPublicPortalLink[];
};

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
      include: { _count: { select: { gallery: true } } },
      take: 20,
    }),
    prisma.clubEventRecord.findMany({
      where: { profileId: profile.id, status: "PAST" },
      orderBy: { eventDate: "desc" },
      include: {
        _count: { select: { gallery: true } },
        gallery: { orderBy: { sortOrder: "asc" }, take: 6 },
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

  return {
    profile: mapClubEventProfile(profile),
    committee: parseCommitteeJson(profile.committeeJson),
    upcomingEvents: upcoming.map(mapClubEventRecord),
    pastEvents: past.map((e) => ({
      ...mapClubEventRecord(e),
      galleryPreview: e.gallery.map((g) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        fileName: g.fileName,
      })),
    })),
    links: mappedLinks,
    standaloneLinks: mappedLinks.filter((l) => !l.config.eventId?.trim()),
  };
}
