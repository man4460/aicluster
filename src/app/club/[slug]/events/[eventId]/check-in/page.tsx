import { Suspense } from "react";
import { notFound } from "next/navigation";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { prisma } from "@/lib/prisma";
import { ClubEventPublicCheckInClient } from "@/systems/club-event/components/ClubEventPublicCheckInClient";

type Props = {
  params: Promise<{ slug: string; eventId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ClubPublicEventCheckInPage({ params, searchParams }: Props) {
  const { slug, eventId } = await params;
  const { t } = await searchParams;
  const profile = await findClubEventPublicProfile(slug, t ?? null);
  if (!profile) notFound();

  const event = await prisma.clubEventRecord.findFirst({
    where: { id: eventId, profileId: profile.id },
    select: { id: true },
  });
  if (!event) notFound();

  return (
    <Suspense fallback={<p className="p-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventPublicCheckInClient slug={slug} eventId={eventId} trialParam={t} />
    </Suspense>
  );
}
