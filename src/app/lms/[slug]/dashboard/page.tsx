import { LmsLearnerDashboardClient } from "@/systems/lms/components/LmsLearnerDashboardClient";

type Props = { params: Promise<{ slug: string }> };

export default async function LmsLearnerDashboardPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <LmsLearnerDashboardClient slug={slug} />
    </main>
  );
}
