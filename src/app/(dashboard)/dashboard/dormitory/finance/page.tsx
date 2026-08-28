import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { DormFinanceClient } from "@/systems/dormitory/components/DormFinanceClient";

export default async function DormitoryFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const baseUrl = await getRequestBaseUrl();

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DormFinanceClient baseUrl={baseUrl} />
    </Suspense>
  );
}
