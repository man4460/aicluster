import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { BuildingPosStaffLinkPageClient } from "@/systems/building-pos/BuildingPosStaffLinkPageClient";

export const metadata = {
  title: "ลิงก์พนักงานเสิร์ฟ | POS ร้านอาหาร",
};

export default async function BuildingPosStaffLinkPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getBusinessProfile(session.sub);
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <BuildingPosStaffLinkPageClient
        shopLabel={profile?.name?.trim() || "POS ร้านอาหาร"}
        logoUrl={profile?.logoUrl?.trim() || null}
      />
    </Suspense>
  );
}
