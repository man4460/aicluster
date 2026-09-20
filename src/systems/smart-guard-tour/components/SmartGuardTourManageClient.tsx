"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  SMART_GUARD_TOUR_MANAGE_TAB_ITEMS,
  parseSmartGuardTourManageTab,
  smartGuardTourManageHref,
  type SmartGuardTourManageTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import { SmartGuardTourStaffPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourStaffPanel";
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

  const setTab = (key: SmartGuardTourManageTabKey) => {
    router.replace(smartGuardTourManageHref(key), { scroll: false });
  };

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
      >
        <p className="mb-3 text-xs font-semibold text-[#66638c]">
          {initialShop.displayName}
          {loading && tab !== "staff" ? " · กำลังโหลด…" : null}
        </p>
        {tab === "staff" ? (
          <SmartGuardTourStaffPanel />
        ) : tab === "checkpoints" ? (
          <SmartGuardTourCheckpointsList rows={data.checkpoints} />
        ) : tab === "schedules" ? (
          <SmartGuardTourSchedulesList rows={data.schedules} />
        ) : tab === "incidents" ? (
          <SmartGuardTourIncidentsList rows={data.incidents} />
        ) : tab === "contacts" ? (
          <SmartGuardTourContactsList rows={data.contacts} />
        ) : tab === "assets" ? (
          <SmartGuardTourAssetsList rows={data.assets} />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
