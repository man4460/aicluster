import { Suspense } from "react";
import { ClubEventEventDeskClient } from "@/systems/club-event/components/ClubEventEventDeskClient";

type Props = { params: Promise<{ id: string }> };

export default async function ClubEventEventDeskPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventEventDeskClient eventId={id} />
    </Suspense>
  );
}
