import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
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
  return { title: `ช่องจอด #${id} | บริการรับฝากจอดรถ` };
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
    <div className="space-y-6">
      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row flex-wrap items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title={`ช่อง ${spot.spotCode}`}
          description={spot.zoneLabel ? spot.zoneLabel : "ลิงก์ QR · เช็คอิน / เช็คเอาต์"}
          action={
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/parking/spots"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-3 text-sm font-semibold sm:px-4",
                )}
              >
                ← รายการช่อง
              </Link>
              <Link
                href="/dashboard/parking"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-3 text-sm font-semibold sm:px-4",
                )}
              >
                ภาพรวม
              </Link>
            </div>
          }
        />

        <div>
          <h2 className="text-sm font-semibold text-[#1e1b4b]">ลิงก์ให้ลูกค้าสแกน QR เช็คอินเอง</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#66638c]">
            พิมพ์ URL นี้เป็น QR แล้ววางที่ช่องจอด — ลูกค้ากรอกทะเบียนและหมายเหตุรับส่งได้เอง
          </p>
          <p className="mt-2 break-all font-mono text-sm text-slate-800">{checkInUrl}</p>
          <div className="mt-3">
            <ParkingCopyUrlButton url={checkInUrl} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <ParkingRegenerateTokenButton spotId={spot.id} />
          </div>
        </div>
      </AppDashboardSection>

      {active ? (
        <AppDashboardSection className="space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#1e1b4b]">กำลังจอดอยู่</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#66638c]">ทะเบียน</dt>
              <dd className="font-bold tabular-nums">{active.licensePlate}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#66638c]">เช็คอิน</dt>
              <dd>{active.checkInAt.toLocaleString("th-TH")}</dd>
            </div>
            {active.customerName ? (
              <div>
                <dt className="text-xs text-[#66638c]">ชื่อ</dt>
                <dd>{active.customerName}</dd>
              </div>
            ) : null}
            {active.customerPhone ? (
              <div>
                <dt className="text-xs text-[#66638c]">โทร</dt>
                <dd className="tabular-nums">{active.customerPhone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-[#66638c]">ช่องทางเช็คอิน</dt>
              <dd>{active.selfCheckIn ? "ลูกค้า (QR)" : "พนักงาน"}</dd>
            </div>
            {active.shuttleFrom || active.shuttleTo || active.shuttleNote ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#66638c]">รับส่ง</dt>
                <dd className="text-slate-800">
                  {active.shuttleFrom ? `จาก ${active.shuttleFrom}` : ""}
                  {active.shuttleFrom && active.shuttleTo ? " → " : ""}
                  {active.shuttleTo ? `ไป ${active.shuttleTo}` : ""}
                  {active.shuttleNote ? (
                    <span className="mt-1 block text-xs text-[#66638c]">{active.shuttleNote}</span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <ParkingCheckoutButton sessionId={active.id} />
        </AppDashboardSection>
      ) : (
        <AppDashboardSection className="p-5 sm:p-6">
          <ParkingStaffCheckInForm spotId={spot.id} />
        </AppDashboardSection>
      )}

      <AppDashboardSection className="border-rose-100 bg-rose-50/30 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-rose-900">โซนอันตราย</h2>
        <p className="mt-1 text-xs text-[#66638c]">ลบช่องได้เมื่อไม่มีรถจอด</p>
        <div className="mt-3">
          <ParkingDeleteSpotButton spotId={spot.id} />
        </div>
      </AppDashboardSection>
    </div>
  );
}
