"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Map,
  MapPin,
  Route,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SMART_GUARD_TOUR_DASHBOARD_TAB_ITEMS,
  parseSmartGuardTourDashboardTab,
  smartGuardTourDashboardTabHref,
  type SmartGuardTourDashboardTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  SmartGuardTourCheckpointsList,
  SmartGuardTourIncidentsList,
  SmartGuardTourMapPlaceholder,
  SmartGuardTourShiftsList,
  SmartGuardTourTourLogsList,
  useSmartGuardCatalog,
} from "@/systems/smart-guard-tour/components/SmartGuardTourCatalogLists";
import { SmartGuardTourDutiesPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourDutiesPanel";
import {
  smartGuardTourCardIconTileClass,
  type SmartGuardTourCardTone,
} from "@/systems/smart-guard-tour/lib/card-tones";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourDashboardTabIcon,
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import {
  smartGuardTourFinanceStatsGridClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourPageStackClass,
  smartGuardTourStatInlineClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

const DASHBOARD_TAB_ITEMS = SMART_GUARD_TOUR_DASHBOARD_TAB_ITEMS.map((item) => ({
  ...item,
  icon: smartGuardTourDashboardTabIcon(item.key),
}));

const TONE_BORDER: Record<SmartGuardTourCardTone, string> = {
  sky: "border-l-sky-500",
  emerald: "border-l-emerald-500",
  rose: "border-l-rose-500",
  orange: "border-l-orange-500",
  amber: "border-l-amber-500",
  slate: "border-l-slate-400",
  violet: "border-l-violet-500",
  indigo: "border-l-indigo-500",
};

type StatKey =
  | "checkpointCount"
  | "tourLogTodayCount"
  | "incidentOpenCount"
  | "staffOnShiftCount"
  | "scheduleTodayCount"
  | "assetCount";

const STAT_CARDS: {
  key: StatKey;
  label: string;
  tab: SmartGuardTourDashboardTabKey;
  tone: SmartGuardTourCardTone;
  icon: ReactNode;
}[] = [
  {
    key: "checkpointCount",
    label: "จุดตรวจ",
    tab: "checkpoints",
    tone: "sky",
    icon: <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
  {
    key: "tourLogTodayCount",
    label: "สายตรวจวันนี้",
    tab: "tour-logs",
    tone: "emerald",
    icon: <Route className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
  {
    key: "incidentOpenCount",
    label: "เหตุการณ์เปิด",
    tab: "incidents",
    tone: "rose",
    icon: <AlertTriangle className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
  {
    key: "staffOnShiftCount",
    label: "รปภ. เข้ากะ",
    tab: "shifts",
    tone: "orange",
    icon: <Shield className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
  {
    key: "scheduleTodayCount",
    label: "ตารางใช้งาน",
    tab: "shifts",
    tone: "amber",
    icon: <CalendarClock className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
  {
    key: "assetCount",
    label: "อุปกรณ์",
    tab: "map-view",
    tone: "slate",
    icon: <Map className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
  },
];

export function SmartGuardTourDashboardClient({ initialShop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseSmartGuardTourDashboardTab(searchParams.get("tab"));
  const { data, loading, notice } = useSmartGuardCatalog();

  const setTab = useCallback(
    (next: SmartGuardTourDashboardTabKey) => {
      router.replace(smartGuardTourDashboardTabHref(next), { scroll: false });
    },
    [router],
  );

  const today = data.today;
  const stats = {
    checkpointCount: data.checkpoints.filter((c) => c.isActive).length,
    tourLogTodayCount: data.tourLogs.filter((t) => t.entryOn === today).length,
    incidentOpenCount: data.incidents.filter(
      (i) => i.status === "PENDING" || i.status === "IN_PROGRESS",
    ).length,
    staffOnShiftCount: data.shifts.filter((s) => s.onDuty && s.shiftOn === today).length,
    scheduleTodayCount: data.schedules.filter((s) => s.isActive).length,
    assetCount: data.assets.length,
  };

  return (
    <div className={smartGuardTourPageStackClass}>
      {notice.popup}
      <SmartGuardTourPageSubNav
        title="แดชบอร์ด"
        titleIcon={smartGuardTourPageTitleIcon("dashboard")}
        titleTone={smartGuardTourPageTitleTone("dashboard")}
        items={DASHBOARD_TAB_ITEMS.map((t) => ({
          key: t.key,
          label: t.shortLabel ?? t.label,
          icon: t.icon,
        }))}
        activeKey={tab}
        onSelect={(k) => setTab(k as SmartGuardTourDashboardTabKey)}
        ariaLabel="เมนูย่อยแดชบอร์ด"
        action={
          tab !== "overview" ? (
            <button
              type="button"
              className={cn(smartGuardTourOutlineButtonClass, "min-w-[40px] sm:min-w-0")}
              onClick={() => setTab("overview")}
              aria-label="กลับภาพรวม"
              title="กลับภาพรวม"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">กลับภาพรวม</span>
            </button>
          ) : undefined
        }
      >
        {tab === "overview" ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#66638c]">
              {initialShop.displayName}
              {loading ? " · กำลังโหลด…" : null}
            </p>
            <div className={smartGuardTourFinanceStatsGridClass}>
              {STAT_CARDS.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setTab(card.tab)}
                  className={cn(
                    smartGuardTourStatInlineClass,
                    "border-l-[3px] text-left transition hover:ring-1 hover:ring-orange-200/80",
                    TONE_BORDER[card.tone],
                  )}
                  aria-label={`ไปที่ ${card.label}`}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                    <span className={smartGuardTourCardIconTileClass(card.tone)}>{card.icon}</span>
                    {card.label}
                  </span>
                  <span className="text-xl font-black tabular-nums text-[#1e1b4b]">
                    {stats[card.key].toLocaleString("th-TH")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : tab === "posts" ? (
          <SmartGuardTourDutiesPanel readOnly />
        ) : tab === "checkpoints" ? (
          <SmartGuardTourCheckpointsList rows={data.checkpoints} />
        ) : tab === "tour-logs" ? (
          <SmartGuardTourTourLogsList rows={data.tourLogs} />
        ) : tab === "incidents" ? (
          <SmartGuardTourIncidentsList rows={data.incidents} />
        ) : tab === "shifts" ? (
          <SmartGuardTourShiftsList rows={data.shifts} />
        ) : tab === "map-view" ? (
          <SmartGuardTourMapPlaceholder checkpoints={data.checkpoints} />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
