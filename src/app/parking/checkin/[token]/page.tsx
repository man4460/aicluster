import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <ParkingPublicCheckInClient token={decodeURIComponent(token)} />
      </div>
      <p className="mx-auto mt-8 max-w-lg text-center text-[10px] text-slate-400">
        หากสแกนแล้วไม่สำเร็จ แจ้งพนักงานลานจอด
      </p>
    </div>
  );
}
