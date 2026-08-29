import { Suspense } from "react";
import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { VillageFeesClient } from "@/systems/village/components/VillageFeesClient";

export default async function VillageFeesPage() {
  const baseUrl = await getRequestBaseUrl();
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <VillageFeesClient initialYm={bangkokYearMonthYm()} baseUrl={baseUrl} />
    </Suspense>
  );
}
