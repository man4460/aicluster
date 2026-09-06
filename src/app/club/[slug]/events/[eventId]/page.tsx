import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadClubEventPublicEventDetail } from "@/lib/club-event/load-public-portal";
import { ClubEventPublicEventDetailClient } from "@/systems/club-event/components/ClubEventPublicEventDetailClient";

type Props = {
  params: Promise<{ slug: string; eventId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, eventId } = await params;
  const data = await loadClubEventPublicEventDetail(slug, eventId, null);
  return {
    title: data ? `${data.event.title} · ${data.profile.displayName || slug}` : `กิจกรรม · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function ClubPublicEventDetailPage({ params, searchParams }: Props) {
  const { slug, eventId } = await params;
  const { t } = await searchParams;
  const data = await loadClubEventPublicEventDetail(slug, eventId, t ?? null);
  if (!data) notFound();

  return <ClubEventPublicEventDetailClient slug={slug} trialParam={t} initialData={data} />;
}
