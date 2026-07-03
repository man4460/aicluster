"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortStatCard } from "@/systems/hotel-resort/components/HotelResortStatCard";
import { HotelResortStatsPanel } from "@/systems/hotel-resort/components/HotelResortStatsPanel";
import { IconCoin, IconRefresh, IconTrendUp } from "@/systems/hotel-resort/components/HotelResortIcons";
import { hotelResortFetchErrorMessage } from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortFieldClass,
  hotelResortFinanceStatTailClass,
  hotelResortFinanceStatsGridClass,
  hotelResortSkeletonClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type FinanceBucket = {
  key: string;
  label: string;
  revenueBaht: number;
  costBaht: number;
};

export function HotelResortFinanceClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<FinanceBucket[]>([]);
  const [totalRevenue7d, setTotalRevenue7d] = useState(0);
  const [totalCost7d, setTotalCost7d] = useState(0);
  const [costOpen, setCostOpen] = useState(false);
  const [costBusy, setCostBusy] = useState(false);
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel-resort/finance-summary", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { buckets?: FinanceBucket[]; totalRevenue7d?: number; totalCost7d?: number };
      setBuckets(Array.isArray(j.buckets) ? j.buckets : []);
      setTotalRevenue7d(j.totalRevenue7d ?? 0);
      setTotalCost7d(j.totalCost7d ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดการเงินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartBuckets = useMemo(() => {
    const max = Math.max(1, ...buckets.map((x) => Math.max(x.revenueBaht, x.costBaht)));
    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      revenue: b.revenueBaht,
      cost: b.costBaht,
      revenuePct: (b.revenueBaht / max) * 100,
      costPct: (b.costBaht / max) * 100,
    }));
  }, [buckets]);

  async function submitCost() {
    setCostBusy(true);
    setError(null);
    try {
      const amount = Math.round(Number(costAmount || 0));
      const res = await fetch("/api/hotel-resort/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label: costLabel.trim(), amountBaht: amount }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setCostOpen(false);
      setCostLabel("");
      setCostAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกต้นทุนไม่สำเร็จ");
    } finally {
      setCostBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? <HotelResortErrorBanner message={error} /> : null}

      <HotelResortStatsPanel title="ภาพรวมการเงิน 7 วัน" gridClassName={hotelResortFinanceStatsGridClass}>
        <HotelResortStatCard
          title="รายได้"
          value={`฿${totalRevenue7d.toLocaleString("th-TH")}`}
          tone="emerald"
          icon={<IconCoin className="h-4 w-4" />}
        />
        <HotelResortStatCard
          title="ต้นทุน"
          value={`฿${totalCost7d.toLocaleString("th-TH")}`}
          tone="rose"
          icon={<IconCoin className="h-4 w-4" />}
        />
        <HotelResortStatCard
          title="กำไรประมาณการ"
          value={`฿${(totalRevenue7d - totalCost7d).toLocaleString("th-TH")}`}
          tone="violet"
          className={hotelResortFinanceStatTailClass}
          icon={<IconTrendUp className="h-4 w-4" />}
        />
      </HotelResortStatsPanel>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="รายได้เทียบต้นทุน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => void load()}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชข้อมูลการเงิน"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 sm:mr-1.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setCostOpen(true)}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-0 font-black sm:min-w-0 sm:px-4"
                aria-label="เพิ่มต้นทุน"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มต้นทุน</span>
              </HotelResortButton>
            </div>
          }
        />
        {loading ? (
          <div className={`mt-4 h-32 ${hotelResortSkeletonClass}`} aria-hidden />
        ) : (
          <AppSparkChartPanel className="mt-4">
            <AppRevenueCostColumnChart
              compact
              title=""
              subtitle=""
              buckets={chartBuckets}
              emptyText="ยังไม่มีข้อมูลการเงิน"
              formatTitle={(b) => `${b.label}: รายได้ ฿${b.revenue.toLocaleString("th-TH")} · ต้นทุน ฿${b.cost.toLocaleString("th-TH")}`}
            />
          </AppSparkChartPanel>
        )}
      </AppDashboardSection>

      <FormModal
        open={costOpen}
        onClose={() => !costBusy && setCostOpen(false)}
        title="บันทึกต้นทุน"
        footer={<FormModalFooterActions onCancel={() => setCostOpen(false)} onSubmit={() => void submitCost()} submitLabel="บันทึก" loading={costBusy} />}
      >
        <div className="space-y-3">
          <input className={hotelResortFieldClass} value={costLabel} onChange={(e) => setCostLabel(e.target.value)} placeholder="รายการต้นทุน" />
          <input className={hotelResortFieldClass} type="number" min={0} value={costAmount} onChange={(e) => setCostAmount(e.target.value)} placeholder="จำนวนเงิน (บาท)" />
        </div>
      </FormModal>
    </div>
  );
}
