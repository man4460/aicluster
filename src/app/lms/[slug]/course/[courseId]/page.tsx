import { LmsStudyRoomClient } from "@/systems/lms/components/LmsStudyRoomClient";

type Props = { params: Promise<{ slug: string; courseId: string }> };

export default async function LmsStudyRoomPage({ params }: Props) {
  const { slug, courseId } = await params;
  return (
    <main className="min-h-screen bg-slate-50">
      <LmsStudyRoomClient slug={slug} courseId={courseId} />
    </main>
  );
}
