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
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { ParkingCheckoutButton } from "@/systems/parking/components/ParkingCheckoutButton";
import { ParkingExpandableDashboardSection } from "@/systems/parking/components/ParkingExpandableDashboardSection";
import { ParkingSpotCustomerQrPanel } from "@/systems/parking/components/ParkingSpotCustomerQrPanel";
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
  const { session, site } = await requireParkingPage();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [spot, profile, baseUrl] = await Promise.all([
    prisma.parkingSpot.findFirst({
      where: { id, siteId: site.id },
      include: {
        sessions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { checkInAt: "desc" },
        },
      },
    }),
    getBusinessProfile(session.sub),
    getRequestBaseUrl(),
  ]);
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
          description={
            spot.zoneLabel
              ? `${spot.zoneLabel} · แยกโซนพนักงานกับ QR ลูกค้าด้านล่าง`
              : "แยกโซนพนักงานบันทึกเช็คอิน และ QR ให้ลูกค้าเช็คอินเอง"
          }
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/parking/spots"
                aria-label="กลับรายการช่องจอด"
                title="รายการช่อง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-3 text-sm font-semibold sm:min-w-0 sm:px-4",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5 sm:hidden"
                  aria-hidden
                >
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">← รายการช่อง</span>
              </Link>
              <Link
                href="/dashboard/parking"
                aria-label="ภาพรวมลานจอด"
                title="ภาพรวม"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-3 text-sm font-semibold sm:min-w-0 sm:px-4",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="h-5 w-5 sm:hidden"
                  aria-hidden
                >
                  <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
                </svg>
                <span className="hidden sm:inline">ภาพรวม</span>
              </Link>
            </div>
          }
        />
      </AppDashboardSection>

      <ParkingExpandableDashboardSection
        title="พนักงานบันทึกเช็คอิน"
        description="ใช้เมื่อลูกค้ามาที่เคาน์เตอร์ — บันทึกทะเบียนและข้อมูลรับส่ง (ไม่ผ่าน QR ลูกค้า)"
        defaultOpen={Boolean(active)}
      >
        <div className="rounded-[2rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
          {active ? (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800/90">กำลังจอดในรอบนี้</p>
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
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-medium text-[#66638c]">ช่องว่าง — กรอกข้อมูลแล้วกดบันทึกเช็คอิน</p>
              <ParkingStaffCheckInForm spotId={spot.id} />
            </>
          )}
        </div>
      </ParkingExpandableDashboardSection>

      <ParkingExpandableDashboardSection
        title="QR สำหรับลูกค้าเช็คอินเอง"
        description="พิมพ์โปสเตอร์หรือดาวน์โหลด PNG / PDF — ลูกค้าสแกนแล้วกรอกทะเบียนได้เอง (คนละช่องทางกับการบันทึกของพนักงาน)"
      >
        <div className="rounded-[2rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
          <ParkingSpotCustomerQrPanel
            checkInUrl={checkInUrl}
            spotId={spot.id}
            spotCode={spot.spotCode}
            zoneLabel={spot.zoneLabel}
            siteName={site.name}
            businessName={profile?.name?.trim() || null}
            logoUrl={profile?.logoUrl?.trim() || null}
            baseUrl={baseUrl}
          />
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/40 pt-4">
            <ParkingRegenerateTokenButton spotId={spot.id} />
          </div>
        </div>
      </ParkingExpandableDashboardSection>

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
