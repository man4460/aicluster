import { ClubEventPublicClient } from "@/systems/club-event/components/ClubEventPublicClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ClubPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  return <ClubEventPublicClient slug={slug} trialParam={t} />;
}
