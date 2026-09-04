import { ClubEventEventDetailClient } from "@/systems/club-event/components/ClubEventEventDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ClubEventEventDetailPage({ params }: Props) {
  const { id } = await params;
  return <ClubEventEventDetailClient eventId={id} />;
}
