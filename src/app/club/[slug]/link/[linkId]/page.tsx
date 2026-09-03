import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { ClubEventPublicLinkClient } from "@/systems/club-event/components/ClubEventPublicLinkClient";
import { prisma } from "@/lib/prisma";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string; linkId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ClubPublicLinkPage({ params, searchParams }: Props) {
  const { slug, linkId } = await params;
  const { t } = await searchParams;
  const profile = await findClubEventPublicProfile(slug, t ?? null);
  if (!profile) notFound();

  const link = await prisma.clubEventDynamicLink.findFirst({
    where: { id: linkId, profileId: profile.id, isActive: true },
  });
  if (!link) notFound();

  const config = parseDynamicLinkConfig(link.configJson);
  let eventTitle: string | null = null;
  if (config.eventId) {
    const ev = await prisma.clubEventRecord.findFirst({
      where: { id: config.eventId, profileId: profile.id },
      select: { title: true },
    });
    eventTitle = ev?.title ?? null;
  }

  return (
    <ClubEventPublicLinkClient
      slug={slug}
      linkId={linkId}
      trialParam={t}
      initialData={{
        ownerId: profile.ownerUserId,
        clubName: profile.displayName,
        paymentRulesNote: profile.paymentRulesNote ?? "",
        link: {
          id: link.id,
          type: link.type,
          title: link.title,
          config,
          eventTitle,
        },
      }}
    />
  );
}
