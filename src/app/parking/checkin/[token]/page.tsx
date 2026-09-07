import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appSafeAreaPageContentTopPadClass } from "@/components/app-templates/safe-area-tokens";
import { cn } from "@/lib/cn";
import { ParkingPublicCheckInClient } from "@/systems/parking/components/ParkingPublicCheckInClient";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "เช็คอิน | ระบบเช่าที่จอดรถ",
  robots: { index: false, follow: false },
};

export default async function ParkingPublicCheckInPage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 8 || token.length > 64) notFound();

  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-gradient-to-b from-slate-100 to-slate-200/80 px-4",
        appSafeAreaPageContentTopPadClass,
        "pb-[max(2.5rem,calc(1.5rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))))]",
      )}
    >
      <div className="mx-auto w-full max-w-lg">
        <ParkingPublicCheckInClient token={decodeURIComponent(token)} />
      </div>
      <p className="mx-auto mt-8 max-w-lg text-center text-[10px] text-slate-400">
        หากสแกนแล้วไม่สำเร็จ แจ้งพนักงานลานจอด
      </p>
    </div>
  );
}
