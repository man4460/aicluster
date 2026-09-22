"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  SMART_GUARD_TOUR_DASHBOARD_TAB_ITEMS,
  parseSmartGuardTourDashboardTab,
  smartGuardTourDashboardTabHref,
  smartGuardTourManageHref,
  type SmartGuardTourDashboardTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  SmartGuardTourPageFilterAction,
  type SmartGuardTourListToolbarApi,
} from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";
import {
  SmartGuardTourMapPlaceholder,
  SmartGuardTourShiftsList,
  SmartGuardTourTourLogsList,
  useSmartGuardCatalog,
} from "@/systems/smart-guard-tour/components/SmartGuardTourCatalogLists";
import { SmartGuardTourDutiesPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourDutiesPanel";
import { SmartGuardTourIncidentsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourIncidentsPanel";
import { SmartGuardTourContactsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourContactsAssetsPanels";
import { SmartGuardTourOverviewPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourOverviewPanel";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourDashboardTabIcon,
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import {
  smartGuardTourInlineSubNavBtnClass,
  smartGuardTourPageStackClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

const DASHBOARD_TAB_ITEMS = SMART_GUARD_TOUR_DASHBOARD_TAB_ITEMS.map((item) => ({
  ...item,
  icon: smartGuardTourDashboardTabIcon(item.key),
}));

export function SmartGuardTourDashboardClient({ initialShop: _shop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabRaw = searchParams.get("tab");
  const tab = parseSmartGuardTourDashboardTab(tabRaw);
  const { data, notice, loading } = useSmartGuardCatalog();
  const [toolbar, setToolbar] = useState<SmartGuardTourListToolbarApi | null>(null);

  useEffect(() => {
    if (tabRaw === "checkpoints") {
      router.replace(smartGuardTourManageHref("checkpoints"));
    }
  }, [tabRaw, router]);

  useEffect(() => {
    if (tab === "overview" || tab === "posts" || tab === "map-view") {
      setToolbar(null);
    }
  }, [tab]);

  const setTab = useCallback(
    (next: SmartGuardTourDashboardTabKey) => {
      router.replace(smartGuardTourDashboardTabHref(next), { scroll: false });
    },
    [router],
  );

  const onEmbeddedToolbar = useCallback((api: SmartGuardTourListToolbarApi | null) => {
    setToolbar(api);
  }, []);

  const backBtn =
    tab !== "overview" ? (
      <button
        type="button"
        className={smartGuardTourInlineSubNavBtnClass(false)}
        onClick={() => setTab("overview")}
        aria-label="กลับภาพรวม"
        title="กลับภาพรวม"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">กลับภาพรวม</span>
      </button>
    ) : null;

  if (tabRaw === "checkpoints") {
    return (
      <div className={smartGuardTourPageStackClass}>
        <p className="p-4 text-sm text-[#66638c]">กำลังไปหน้าจัดการจุดตรวจ…</p>
      </div>
    );
  }

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
        action={<SmartGuardTourPageFilterAction toolbar={toolbar} leading={backBtn} />}
      >
        {tab === "overview" ? (
          <SmartGuardTourOverviewPanel data={data} loading={loading} onGoTab={setTab} />
        ) : tab === "tour-logs" ? (
          <SmartGuardTourTourLogsList
            key={tab}
            rows={data.tourLogs}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : tab === "incidents" ? (
          <SmartGuardTourIncidentsPanel key={tab} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "posts" ? (
          <SmartGuardTourDutiesPanel readOnly />
        ) : tab === "shifts" ? (
          <SmartGuardTourShiftsList
            key={tab}
            rows={data.shifts}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : tab === "contacts" ? (
          <SmartGuardTourContactsPanel key={tab} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "map-view" ? (
          <SmartGuardTourMapPlaceholder checkpoints={data.checkpoints} />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
