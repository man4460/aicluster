import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  parkingListRowAccentClass,
  parkingListRowCardClass,
  parkingListScrollShellClass,
} from "@/systems/parking/parking-ui-tokens";

export type ParkingHistoryListSession = {
  id: number;
  checkInAt: Date;
  checkOutAt: Date | null;
  licensePlate: string;
  customerName: string | null;
  customerPhone: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  selfCheckIn: boolean;
  amountDueBaht: unknown;
  spot: { spotCode: string; zoneLabel: string | null };
};

function statusLabelTh(status: ParkingHistoryListSession["status"]): string {
  if (status === "ACTIVE") return "กำลังจอด";
  if (status === "COMPLETED") return "เสร็จ";
  return "ยกเลิก";
}

function statusPillClass(status: ParkingHistoryListSession["status"]) {
  if (status === "ACTIVE") {
    return "bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-200/90";
  }
  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-200/90";
  }
  return "bg-rose-50 text-rose-800 shadow-sm ring-1 ring-rose-200/90";
}

function amountText(amountDueBaht: unknown): string {
  if (amountDueBaht == null) return "—";
  const n = Number(amountDueBaht);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("th-TH")} บ.`;
}

/** รายการประวัติแบบการ์ด — เทียบลำดับรายการใน CarWashSalesPanel */
export function ParkingHistorySessionList({ sessions }: { sessions: ParkingHistoryListSession[] }) {
  if (sessions.length === 0) {
    return <AppEmptyState tone="glass">ไม่พบรายการตามเงื่อนไข</AppEmptyState>;
  }

  return (
    <div className={parkingListScrollShellClass}>
      <ul
        className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:gap-4"
        aria-label="ประวัติการจอดรถ"
      >
        {sessions.map((s) => {
          const checkInStr = s.checkInAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
          const checkOutStr = s.checkOutAt
            ? s.checkOutAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
            : null;
          const zone = s.spot.zoneLabel?.trim() || null;

          return (
            <li key={s.id} className={parkingListRowCardClass}>
              <span aria-hidden className={parkingListRowAccentClass} />

              <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2 sm:pl-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <time
                    className="text-[10px] font-bold tabular-nums uppercase tracking-tight text-slate-400"
                    dateTime={s.checkInAt.toISOString()}
                  >
                    {checkInStr}
                  </time>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black leading-tight",
                      statusPillClass(s.status),
                    )}
                  >
                    {statusLabelTh(s.status)}
                    {s.selfCheckIn ? " · QR" : ""}
                  </span>
                  <span className="shrink-0 rounded-md bg-slate-100/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                    #{s.id}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-lg font-black tabular-nums tracking-tight text-[#1e1b4b]">
                    {s.licensePlate.trim() || "—"}
                  </p>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-black tabular-nums text-[#5b61ff]">{amountText(s.amountDueBaht)}</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-700">
                  ช่อง{" "}
                  <span className="tabular-nums text-[#4d47b6]">{s.spot.spotCode}</span>
                  {zone ? (
                    <span className="font-medium text-[#66638c]">
                      {" "}
                      · <span className="text-[#5f5a8a]">{zone}</span>
                    </span>
                  ) : null}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    ลูกค้า
                  </span>
                  <p className="truncate text-[11px] font-medium text-slate-500">
                    {s.customerName?.trim() || "—"}
                    {s.customerPhone?.trim() ? (
                      <span className="ml-1.5 font-mono tabular-nums text-slate-400">
                        · {s.customerPhone.trim()}
                      </span>
                    ) : null}
                  </p>
                </div>

                <p className="text-[10px] font-semibold tabular-nums text-slate-400">
                  เช็คเอาต์:{" "}
                  <span className="text-slate-500">{checkOutStr ?? "—"}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
