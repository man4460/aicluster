import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  parkingListRowAccentClass,
  parkingListRowCardClass,
  parkingListScrollShellClass,
} from "@/systems/parking/parking-ui-tokens";

export type ParkingSpotGridRow = {
  id: number;
  spotCode: string;
  zoneLabel: string | null;
  /** URL เต็มสำหรับ QR เช็คอิน — สร้างฝั่งเซิร์ฟเวอร์ */
  checkInUrl: string;
  activeSession: { licensePlate: string; checkInAt: Date } | null;
};

/** รายการช่องจอดแบบการ์ด — กริดเดียวกับ `ParkingHistorySessionList` (1 col / 2 col) */
export function ParkingSpotsGridList({ spots }: { spots: ParkingSpotGridRow[] }) {
  if (spots.length === 0) {
    return <AppEmptyState tone="glass">ยังไม่มีช่องจอด — เพิ่มได้จากฟอร์มด้านบน</AppEmptyState>;
  }

  return (
    <div className={parkingListScrollShellClass}>
      <ul
        className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:gap-4"
        aria-label="รายการช่องจอด"
      >
        {spots.map((s) => {
          const occupied = Boolean(s.activeSession);
          const checkInStr = s.activeSession
            ? s.activeSession.checkInAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
            : null;
          const href = `/dashboard/parking/spots/${s.id}`;
          const zone = s.zoneLabel?.trim() || null;

          return (
            <li key={s.id} className="min-h-0">
              <Link
                href={href}
                className={cn(
                  parkingListRowCardClass,
                  "outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 focus-visible:ring-offset-2",
                )}
              >
                <span aria-hidden className={parkingListRowAccentClass} />

                <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2 sm:pl-2.5">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <span className="truncate text-lg font-black tabular-nums tracking-tight text-[#1e1b4b]">
                      {s.spotCode}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black leading-tight shadow-sm ring-1 ring-inset",
                        occupied
                          ? "bg-amber-50 text-amber-950 ring-amber-200/90"
                          : "bg-emerald-50 text-emerald-900 ring-emerald-200/90",
                      )}
                    >
                      {occupied ? "มีรถจอด" : "ว่าง"}
                    </span>
                  </div>

                  {zone ? (
                    <p className="text-[11px] font-semibold text-[#5f5a8a]">{zone}</p>
                  ) : null}

                  <p
                    className="line-clamp-2 break-all font-mono text-[10px] leading-snug text-[#66638c] md:line-clamp-3"
                    title={s.checkInUrl}
                  >
                    {s.checkInUrl}
                  </p>

                  {occupied && s.activeSession ? (
                    <p className="text-[11px] font-semibold text-amber-900">
                      {s.activeSession.licensePlate}
                      <span className="font-medium text-[#66638c]"> · เข้า {checkInStr}</span>
                    </p>
                  ) : null}

                  <p className="pt-1 text-[11px] font-black text-[#5b61ff] group-hover/item:text-[#4338ca]">
                    เปิดรายละเอียด →
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
