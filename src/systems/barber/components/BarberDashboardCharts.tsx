"use client";

import {
  AppColumnBarDualSparkChart,
  AppColumnBarSparkChart,
  AppSparkChartPanel,
  AppSparkChartsTwoColumnGrid,
  type AppColumnBarBucket,
  type AppDualColumnBarBucket,
} from "@/components/app-templates";

type Props = {
  visitDualBuckets: AppDualColumnBarBucket[];
  packageSalesBuckets: AppColumnBarBucket[];
};

/** กราฟจำนวนครั้ง (หักแพ็ก / เงินสด) คู่กราฟยอดขายแพ็กเกจ — กราฟรายได้เทียบต้นทุนอยู่ด้านบน */
export function BarberDashboardCharts({ visitDualBuckets, packageSalesBuckets }: Props) {
  return (
    <AppSparkChartsTwoColumnGrid>
      <AppSparkChartPanel>
        <AppColumnBarDualSparkChart
          className="flex min-h-0 flex-1 flex-col"
          compact
          titleTone="brand"
          title="จำนวนครั้งใช้บริการ"
          subtitle="แท่งซ้าย = หักแพ็ก · แท่งขวา = เงินสด"
          seriesALabel="หักแพ็ก"
          seriesBLabel="เงินสด"
          emptyText="ไม่มีการบันทึกในช่วงนี้"
          buckets={visitDualBuckets}
          formatGroupTitle={(b) => `หักแพ็ก ${b.seriesA.amount} ครั้ง · เงินสด ${b.seriesB.amount} ครั้ง`}
        />
      </AppSparkChartPanel>
      <AppSparkChartPanel>
        <AppColumnBarSparkChart
          className="flex min-h-0 flex-1 flex-col"
          variant="brand"
          compact
          pairedLayout
          title="ยอดขายแพ็กเกจ (เปิดแพ็กใหม่)"
          subtitle="ราคาแพ็กเต็มตามวันที่สร้างแพ็ก"
          emptyText="ไม่มียอดขายแพ็กในช่วงนี้"
          buckets={packageSalesBuckets}
          formatTitle={(b) => `฿${b.amount.toLocaleString()}`}
        />
      </AppSparkChartPanel>
    </AppSparkChartsTwoColumnGrid>
  );
}
