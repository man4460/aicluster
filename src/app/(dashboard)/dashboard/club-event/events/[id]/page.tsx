import { ClubEventEventEditorClient } from "@/systems/club-event/components/ClubEventEventEditorClient";

type Props = { params: Promise<{ id: string }> };

export default async function ClubEventEventPage({ params }: Props) {
  const { id } = await params;
  return <ClubEventEventEditorClient eventId={id} />;
}
