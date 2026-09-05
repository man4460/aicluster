import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { EcommerceManageHubClient } from "@/systems/ecommerce-store/components/EcommerceManageHubClient";

export const metadata: Metadata = {
  title: "การจัดการ · ร้านออนไลน์ | MAWELL",
};

export default async function EcommerceStoreManagePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <EcommerceManageHubClient />
    </Suspense>
  );
}
