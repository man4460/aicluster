"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SMART_GUARD_TOUR_MANAGE_TAB_ITEMS,
  parseSmartGuardTourManageTab,
  smartGuardTourManageHref,
  type SmartGuardTourManageTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  SmartGuardTourPageFilterAction,
  type SmartGuardTourListToolbarApi,
} from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";
import { SmartGuardTourStaffPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourStaffPanel";
import { SmartGuardTourPostsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourPostsPanel";
import { SmartGuardTourDutiesPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourDutiesPanel";
import {
  SmartGuardTourAssetsList,
  SmartGuardTourCheckpointsList,
  SmartGuardTourContactsList,
  SmartGuardTourIncidentsList,
  SmartGuardTourSchedulesList,
  useSmartGuardCatalog,
} from "@/systems/smart-guard-tour/components/SmartGuardTourCatalogLists";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourManageTabIcon,
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import { smartGuardTourPageStackClass } from "@/systems/smart-guard-tour/lib/ui-tokens";

export function SmartGuardTourManageClient({ initialShop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseSmartGuardTourManageTab(searchParams.get("tab"));
  const { data, loading, notice } = useSmartGuardCatalog();
  const [toolbar, setToolbar] = useState<SmartGuardTourListToolbarApi | null>(null);

  const setTab = (key: SmartGuardTourManageTabKey) => {
    setToolbar(null);
    router.replace(smartGuardTourManageHref(key), { scroll: false });
  };

  const onEmbeddedToolbar = useCallback((api: SmartGuardTourListToolbarApi | null) => {
    setToolbar(api);
  }, []);

  return (
    <div className={smartGuardTourPageStackClass}>
      {notice.popup}
      <SmartGuardTourPageSubNav
        title="การจัดการ"
        titleIcon={smartGuardTourPageTitleIcon("manage")}
        titleTone={smartGuardTourPageTitleTone("manage")}
        items={SMART_GUARD_TOUR_MANAGE_TAB_ITEMS.map((t) => ({
          key: t.key,
          label: t.shortLabel ?? t.label,
          icon: smartGuardTourManageTabIcon(t.key),
        }))}
        activeKey={tab}
        onSelect={(k) => setTab(k as SmartGuardTourManageTabKey)}
        ariaLabel="เมนูย่อยการจัดการ"
        action={<SmartGuardTourPageFilterAction toolbar={toolbar} />}
      >
        <p className="mb-3 text-xs font-semibold text-[#66638c]">
          {initialShop.displayName}
          {loading && tab !== "staff" ? " · กำลังโหลด…" : null}
        </p>
        {tab === "staff" ? (
          <SmartGuardTourStaffPanel onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "posts" ? (
          <SmartGuardTourPostsPanel />
        ) : tab === "duties" ? (
          <SmartGuardTourDutiesPanel />
        ) : tab === "checkpoints" ? (
          <SmartGuardTourCheckpointsList rows={data.checkpoints} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "schedules" ? (
          <SmartGuardTourSchedulesList rows={data.schedules} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "incidents" ? (
          <SmartGuardTourIncidentsList rows={data.incidents} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "contacts" ? (
          <SmartGuardTourContactsList rows={data.contacts} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : tab === "assets" ? (
          <SmartGuardTourAssetsList rows={data.assets} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
