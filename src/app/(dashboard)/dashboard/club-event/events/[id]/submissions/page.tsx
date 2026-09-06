import { Suspense } from "react";
import { ClubEventEventSubmissionsClient } from "@/systems/club-event/components/ClubEventEventSubmissionsClient";

type Props = { params: Promise<{ id: string }> };

export default async function ClubEventEventSubmissionsPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventEventSubmissionsClient eventId={id} />
    </Suspense>
  );
}
