import type { Metadata } from "next";
import { Suspense } from "react";
import { BuildingPosPresentationClient } from "@/systems/building-pos/components/BuildingPosPresentationClient";
import { BUILDING_POS_PUBLIC_PRESENTATION_HREF } from "@/systems/building-pos/building-pos-nav";

const title = "MAWELL PLATFORM · POS ร้านอาหาร";
const description =
  "แนะนำ MAWELL PLATFORM และโมดูล POS ร้านอาหาร — เมนู · ออเดอร์ · ครัว · เสิร์ฟ · ชำระเงิน";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: BUILDING_POS_PUBLIC_PRESENTATION_HREF,
    siteName: "MAWELL",
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** สไลด์สาธารณะเต็มจอ — ไม่ต้องล็อกอิน แชร์ Facebook / LINE ได้ */
export default function BuildingPosPublicPresentationPage() {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8]">
      <Suspense
        fallback={
          <div className="flex h-dvh w-full items-center justify-center" aria-hidden>
            <div className="h-16 w-16 animate-pulse rounded-[1.5rem] bg-[#ecebff]/70" />
          </div>
        }
      >
        <BuildingPosPresentationClient variant="public" />
      </Suspense>
    </div>
  );
}
