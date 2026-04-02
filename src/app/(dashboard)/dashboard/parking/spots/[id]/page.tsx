import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { prisma } from "@/lib/prisma";
import { parkingBtnSecondary, parkingCard } from "@/systems/parking/parking-ui";
import { ParkingCheckoutButton } from "@/systems/parking/components/ParkingCheckoutButton";
import { ParkingCopyUrlButton } from "@/systems/parking/components/ParkingCopyUrlButton";
import { ParkingRegenerateTokenButton, ParkingDeleteSpotButton } from "@/systems/parking/components/ParkingSpotAdminButtons";
import { ParkingStaffCheckInForm } from "@/systems/parking/components/ParkingStaffCheckInForm";
import { publicParkingCheckInUrl } from "@/systems/parking/lib/public-checkin-url";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return { title: "ช่องจอด" };
  return { title: `ช่องจอด #${id} | ระบบเช่าที่จอดรถ` };
}

export default async function ParkingSpotDetailPage({ params }: Props) {
  const { site } = await requireParkingPage();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const spot = await prisma.parkingSpot.findFirst({
    where: { id, siteId: site.id },
    include: {
      sessions: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { checkInAt: "desc" },
      },
    },
  });
  if (!spot) notFound();

  const active = spot.sessions[0];
  const checkInUrl = publicParkingCheckInUrl(spot.checkInToken);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`ช่อง ${spot.spotCode}`}
        description={spot.zoneLabel ? spot.zoneLabel : "รายละเอียดช่องจอด · ลิงก์ QR · เช็คอิน/เช็คเอาต์"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/parking/spots" className={parkingBtnSecondary}>
              ← รายการช่อง
            </Link>
            <Link href="/dashboard/parking" className={parkingBtnSecondary}>
              ผัง
            </Link>
          </div>
        }
      />

      <section className={`${parkingCard} space-y-4 p-5`}>
        <h2 className="text-sm font-semibold text-slate-900">ลิงก์ให้ลูกค้าสแกน QR เช็คอินเอง</h2>
        <p className="text-xs leading-relaxed text-slate-500">
          พิมพ์ URL นี้เป็น QR แล้ววางที่ช่องจอด — ลูกค้ากรอกทะเบียนและหมายเหตุรับส่งได้เอง
        </p>
        <p className="break-all font-mono text-sm text-slate-800">{checkInUrl}</p>
        <ParkingCopyUrlButton url={checkInUrl} />
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <ParkingRegenerateTokenButton spotId={spot.id} />
        </div>
      </section>

      {active ? (
        <section className={`${parkingCard} space-y-4 p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">กำลังจอดอยู่</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">ทะเบียน</dt>
              <dd className="font-bold tabular-nums">{active.licensePlate}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">เช็คอิน</dt>
              <dd>{active.checkInAt.toLocaleString("th-TH")}</dd>
            </div>
            {active.customerName ? (
              <div>
                <dt className="text-xs text-slate-500">ชื่อ</dt>
                <dd>{active.customerName}</dd>
              </div>
            ) : null}
            {active.customerPhone ? (
              <div>
                <dt className="text-xs text-slate-500">โทร</dt>
                <dd className="tabular-nums">{active.customerPhone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-slate-500">ช่องทางเช็คอิน</dt>
              <dd>{active.selfCheckIn ? "ลูกค้า (QR)" : "พนักงาน"}</dd>
            </div>
            {active.shuttleFrom || active.shuttleTo || active.shuttleNote ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">รับส่ง</dt>
                <dd className="text-slate-800">
                  {active.shuttleFrom ? `จาก ${active.shuttleFrom}` : ""}
                  {active.shuttleFrom && active.shuttleTo ? " → " : ""}
                  {active.shuttleTo ? `ไป ${active.shuttleTo}` : ""}
                  {active.shuttleNote ? (
                    <span className="mt-1 block text-xs text-slate-600">{active.shuttleNote}</span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <ParkingCheckoutButton sessionId={active.id} />
        </section>
      ) : (
        <section className={`${parkingCard} p-5`}>
          <ParkingStaffCheckInForm spotId={spot.id} />
        </section>
      )}

      <section className={`${parkingCard} border-red-100 p-5`}>
        <h2 className="text-sm font-semibold text-red-900">โซนอันตราย</h2>
        <p className="mt-1 text-xs text-slate-600">ลบช่องได้เมื่อไม่มีรถจอด</p>
        <div className="mt-3">
          <ParkingDeleteSpotButton spotId={spot.id} />
        </div>
      </section>
    </div>
  );
}
