import { ClubEventPublicLinkClient } from "@/systems/club-event/components/ClubEventPublicLinkClient";

type Props = {
  params: Promise<{ slug: string; linkId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ClubPublicLinkPage({ params, searchParams }: Props) {
  const { slug, linkId } = await params;
  const { t } = await searchParams;
  return <ClubEventPublicLinkClient slug={slug} linkId={linkId} trialParam={t} />;
}
