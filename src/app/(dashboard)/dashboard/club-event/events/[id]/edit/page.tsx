import { ClubEventEventEditorClient } from "@/systems/club-event/components/ClubEventEventEditorClient";

type Props = { params: Promise<{ id: string }> };

export default async function ClubEventEventEditPage({ params }: Props) {
  const { id } = await params;
  return <ClubEventEventEditorClient eventId={id} />;
}
