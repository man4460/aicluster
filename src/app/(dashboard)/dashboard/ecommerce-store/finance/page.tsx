import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EcommerceFinanceClient } from "@/systems/ecommerce-store/components/EcommerceFinanceClient";

export default async function EcommerceStoreFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <EcommerceFinanceClient />
    </Suspense>
  );
}
