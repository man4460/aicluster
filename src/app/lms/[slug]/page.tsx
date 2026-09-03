import { LmsLearnerLoginClient } from "@/systems/lms/components/LmsLearnerLoginClient";

type Props = { params: Promise<{ slug: string }> };

export default async function LmsLearnerLoginPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white">
      <LmsLearnerLoginClient slug={slug} />
    </main>
  );
}
