"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppEmptyState } from "@/components/app-templates";
import {
  SMART_GUARD_TOUR_MANAGE_TAB_ITEMS,
  parseSmartGuardTourManageTab,
  smartGuardTourManageHref,
  type SmartGuardTourManageTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
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

  const setTab = (key: SmartGuardTourManageTabKey) => {
    router.replace(smartGuardTourManageHref(key), { scroll: false });
  };

  const activeLabel =
    SMART_GUARD_TOUR_MANAGE_TAB_ITEMS.find((t) => t.key === tab)?.label ?? "การจัดการ";

  return (
    <div className={smartGuardTourPageStackClass}>
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
        <p className="mb-3 text-xs font-semibold text-[#66638c]">{initialShop.displayName}</p>
        <AppEmptyState>
          ยังไม่มี{activeLabel}
          <span className="mt-1 block text-xs">
            เฟสถัดไป — CRUD จุดตรวจ · ตาราง · พนักงาน · เหตุการณ์ · ผู้ติดต่อ · อุปกรณ์
          </span>
        </AppEmptyState>
      </SmartGuardTourPageSubNav>
    </div>
  );
}
