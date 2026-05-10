import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";

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
    <div
      className={cn(
        "max-h-[min(78vh,52rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch]",
        "md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none md:max-h-none md:overflow-visible",
      )}
    >
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
                  "group/item relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-[1.25rem] border border-white/55 bg-white/45 px-3 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 outline-none sm:gap-3 sm:px-4 sm:py-4",
                  "focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 focus-visible:ring-offset-2",
                  "md:border-white/60 md:bg-white/50 md:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.42)] md:backdrop-blur-xl md:hover:-translate-y-1 md:hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.45)]",
                )}
              >
                <span
                  aria-hidden
                  className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff] via-[#8d64ff] to-[#f06dc8] opacity-80 transition-all group-hover/item:w-1.5"
                />

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
