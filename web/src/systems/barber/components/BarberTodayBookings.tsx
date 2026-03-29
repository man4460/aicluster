import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">คิววันนี้ (เวลาไทย)</h2>
        <Link
          href="/dashboard/barber/bookings"
          className="rounded-xl bg-[#0000BF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0000a6]"
        >
          จองคิว / จัดการ
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">ยังไม่มีคิววันนี้</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-slate-900">{b.phone}</p>
                <p className="text-sm text-slate-700">{b.customerName?.trim() || "—"}</p>
                <p className="mt-1 text-xs text-slate-500">
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
