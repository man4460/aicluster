import type { Metadata } from "next";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { AppointmentQueueDashboardHubClient } from "@/systems/appointment-queue/components/AppointmentQueueDashboardHubClient";
import { AppointmentQueueBoardClient } from "@/systems/appointment-queue/components/AppointmentQueueBoardClient";
import { AppointmentQueueQrHubCard } from "@/systems/appointment-queue/components/AppointmentQueueQrHubCard";
import { AppointmentQueueStatCard } from "@/systems/appointment-queue/components/AppointmentQueueStatCard";
import { loadAppointmentQueueDashboard } from "@/systems/appointment-queue/lib/load-dashboard";
import { loadAppointmentQueueServices } from "@/systems/appointment-queue/lib/load-services";
import { requireAppointmentQueuePage } from "@/systems/appointment-queue/lib/page-auth";
import { aqPageStackClass, aqSectionFirstClass, aqSectionNextClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

export const metadata: Metadata = {
  title: "จองคิวอัจฉริยะ | MAWELL",
};

export default async function AppointmentQueueDashboardPage() {
  const { userId, scope, profile } = await requireAppointmentQueuePage();
  const [initial, initialServices] = await Promise.all([
    loadAppointmentQueueDashboard(userId, scope.trialSessionId),
    loadAppointmentQueueServices(userId, scope.trialSessionId),
  ]);
  if (!initial) {
    return <p className="text-sm text-rose-600">โหลดข้อมูลไม่สำเร็จ</p>;
  }

  const baseUrl = await getRequestBaseUrl();
  const shopLabel = profile.displayName?.trim() || "จองคิวออนไลน์";

  const settingsInitial = {
    displayName: profile.displayName,
    tagline: profile.tagline,
    contactPhone: profile.contactPhone,
    address: profile.address,
    publicBookingEnabled: profile.publicBookingEnabled,
    depositRequired: profile.depositRequired,
    depositAmountBaht: profile.depositAmountBaht != null ? Number(profile.depositAmountBaht) : null,
    promptPayId: profile.promptPayId,
    promptPayName: profile.promptPayName,
    bankAccountNote: profile.bankAccountNote,
    defaultSlotMinutes: profile.defaultSlotMinutes,
  };

  const overview = (
    <>
      <section className={aqSectionFirstClass} aria-label="สถิติวันนี้">
        <h2 className="text-lg font-bold text-[#2e2a58]">สถิติวันนี้</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AppointmentQueueStatCard title="รอมัดจำ" value={initial.stats.pendingDeposit} tone="amber" />
          <AppointmentQueueStatCard title="คิวจองแล้ว" value={initial.stats.booked} tone="indigo" />
          <AppointmentQueueStatCard
            title="รวมวันนี้"
            value={initial.stats.todayTotal}
            tone="violet"
            colSpanMobile
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      <section className={aqSectionNextClass} aria-label="คิววันนี้">
        <AppointmentQueueBoardClient
          ownerId={userId}
          trialSessionId={scope.trialSessionId}
          initial={initial}
          services={initialServices}
          overview
        />
      </section>

      <section className={aqSectionNextClass} aria-label="QR ลูกค้า">
        <AppointmentQueueQrHubCard
          ownerId={userId}
          shopLabel={shopLabel}
          logoUrl={null}
          baseUrl={baseUrl}
          trialSessionId={scope.trialSessionId}
          trialExportBlocked={scope.isTrialSandbox}
        />
      </section>
    </>
  );

  return (
    <div className={aqPageStackClass}>
      <AppointmentQueueDashboardHubClient
        initialDateKey={bangkokDateKey()}
        ownerId={userId}
        trialSessionId={scope.trialSessionId}
        initialBoard={initial}
        initialServices={initialServices}
        settingsInitial={settingsInitial}
      >
        {overview}
      </AppointmentQueueDashboardHubClient>
    </div>
  );
}
