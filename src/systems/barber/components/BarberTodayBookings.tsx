import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { AppEmptyState, AppSectionHeader } from "@/components/app-templates";
import { barberListRowCardClass, barberSectionFirstClass } from "@/systems/barber/components/barber-ui-tokens";
import { BarberBookingStatusBadge } from "./BarberBookingStatusBadge";

export async function BarberTodayBookings({ ownerId }: { ownerId: string }) {
  const scope = await getBarberDataScope(ownerId);
  const { start, end } = bangkokDayStartEnd();
  const rows = await prisma.barberBooking.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId: scope.trialSessionId,
      scheduledAt: { gte: start, lt: end },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <section className={barberSectionFirstClass} aria-label="คิววันนี้">
      <AppSectionHeader
        tone="violet"
        title="คิววันนี้"
        description="นัดวันนี้ตามเวลาไทย"
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Link
              href="/dashboard/barber/check-in"
              className="app-btn-primary rounded-xl px-3 py-2 text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm"
            >
              เช็กอิน
            </Link>
            <Link
              href="/dashboard/barber/bookings"
              className="app-btn-soft rounded-xl px-3 py-2 text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm"
            >
              จัดการคิว
            </Link>
          </div>
        }
      />
      {rows.length === 0 ? (
        <AppEmptyState tone="violet" className="py-8 text-sm">
          ยังไม่มีคิววันนี้
        </AppEmptyState>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((b) => (
            <li
              key={b.id}
              className={`flex flex-wrap items-center justify-between gap-3 ${barberListRowCardClass}`}
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold leading-snug text-[#2e2a58]">{b.phone}</p>
                <p className="mt-0.5 text-xs text-[#5f5a8a]">{b.customerName?.trim() || "—"}</p>
                <p className="mt-1 text-xs tabular-nums text-[#8b87ad]">
                  {b.scheduledAt.toLocaleTimeString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <BarberBookingStatusBadge status={b.status} scheduledAt={b.scheduledAt} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
