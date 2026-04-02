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

  return <ParkingPublicCheckInClient token={decodeURIComponent(token)} />;
}
