import { ParkingStatCard } from "@/systems/parking/components/ParkingStatCard";

function fmtBaht(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บ.`;
}

/** ตัวเลขสรุปชุดเดียวกับการกรองในหน้าประวัติ */
export function ParkingHistoryFilteredSummary({
  total,
  activeCount,
  completedCount,
  cancelledCount,
  sumDueBaht,
  sumPaidBaht,
}: {
  total: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  sumDueBaht: number;
  sumPaidBaht: number;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
      aria-label="สรุปตามการกรองข้อมูล"
    >
      <ParkingStatCard title="รายการที่ตรงเงื่อนไข" value={total.toLocaleString("th-TH")} tone="slate" />
      <ParkingStatCard title="กำลังจอด" value={activeCount.toLocaleString("th-TH")} tone="indigo" />
      <ParkingStatCard title="เสร็จแล้ว" value={completedCount.toLocaleString("th-TH")} tone="emerald" />
      <ParkingStatCard title="ยกเลิก" value={cancelledCount.toLocaleString("th-TH")} tone="slate" />
      <ParkingStatCard title="ยอดคิดเงินรวม" value={fmtBaht(sumDueBaht)} tone="indigo" />
      <ParkingStatCard title="ยอดชำระรวม" value={fmtBaht(sumPaidBaht)} tone="emerald" />
    </div>
  );
}
