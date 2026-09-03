import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadClubEventPublicPortal } from "@/lib/club-event/load-public-portal";
import { ClubEventPublicClient } from "@/systems/club-event/components/ClubEventPublicClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `ชมรม · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function ClubPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  const data = await loadClubEventPublicPortal(slug, t ?? null);
  if (!data) notFound();

  return <ClubEventPublicClient slug={slug} trialParam={t} initialData={data} />;
}
