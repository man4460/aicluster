import { Suspense } from "react";
import { SmartPoliceCaseDetailClient } from "@/systems/smart-police/components/SmartPoliceCaseDetailClient";

export default async function SmartPoliceCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartPoliceCaseDetailClient caseId={id} />
    </Suspense>
  );
}
