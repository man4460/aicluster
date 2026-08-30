import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  IconRowEdit,
  IconRowRemove,
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  parkingListRowAccentClass,
  parkingListRowCardClass,
  parkingListScrollShellClass,
} from "@/systems/parking/parking-ui-tokens";

export type ParkingSpotGridRow = {
  id: number;
  spotCode: string;
  zoneLabel: string | null;
  activeSession: { licensePlate: string; checkInAt: Date } | null;
};

/** รายการช่องจอดแบบการ์ด — จัดการลาน (แก้ไข/ลบ ไม่ลิงก์ไปเช็คอิน) */
export function ParkingSpotsGridList({
  spots,
  emptyLabel = "ยังไม่มีช่องจอด — กด「เพิ่มช่อง」",
  onEdit,
  onDelete,
}: {
  spots: ParkingSpotGridRow[];
  emptyLabel?: string;
  onEdit: (spotId: number) => void;
  onDelete: (spotId: number) => void;
}) {
  if (spots.length === 0) {
    return <AppEmptyState tone="glass">{emptyLabel}</AppEmptyState>;
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
          const zone = s.zoneLabel?.trim() || null;

          return (
            <li key={s.id} className="min-h-0">
              <div className={cn(parkingListRowCardClass, "group/item")}>
                <span aria-hidden className={parkingListRowAccentClass} />

                <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2 sm:pl-2.5">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                        <p className="mt-1 text-[11px] font-semibold text-[#5f5a8a]">{zone}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขช่อง ${s.spotCode}`}
                        title="แก้ไข"
                        onClick={() => onEdit(s.id)}
                      >
                        <IconRowEdit className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบช่อง ${s.spotCode}`}
                        title="ลบ"
                        onClick={() => onDelete(s.id)}
                      >
                        <IconRowRemove className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {occupied && s.activeSession ? (
                    <p className="text-[11px] font-semibold text-amber-900">
                      {s.activeSession.licensePlate}
                      <span className="font-medium text-[#66638c]"> · เข้า {checkInStr}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
