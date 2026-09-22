"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SMART_GUARD_TOUR_MANAGE_GROUPS,
  isSmartGuardTourManageContactsLegacyTab,
  isSmartGuardTourManageIncidentsLegacyTab,
  parseSmartGuardTourManageLeaf,
  smartGuardTourDashboardTabHref,
  smartGuardTourManageGroupForLeaf,
  smartGuardTourManageHref,
  type SmartGuardTourManageGroupKey,
  type SmartGuardTourManageLeafKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  SmartGuardTourPageFilterAction,
  type SmartGuardTourListToolbarApi,
} from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";
import { SmartGuardTourStaffPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourStaffPanel";
import { SmartGuardTourPostsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourPostsPanel";
import { SmartGuardTourDutiesPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourDutiesPanel";
import { SmartGuardTourCheckpointsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourCheckpointsPanel";
import { SmartGuardTourSchedulesPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourSchedulesPanel";
import { SmartGuardTourAssetsPanel } from "@/systems/smart-guard-tour/components/SmartGuardTourContactsAssetsPanels";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourManageGroupIcon,
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import { smartGuardTourPageStackClass } from "@/systems/smart-guard-tour/lib/ui-tokens";

export function SmartGuardTourManageClient({ initialShop: _shop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const subParam = searchParams.get("sub");
  const [toolbar, setToolbar] = useState<SmartGuardTourListToolbarApi | null>(null);

  useEffect(() => {
    if (isSmartGuardTourManageIncidentsLegacyTab(tabParam)) {
      router.replace(smartGuardTourDashboardTabHref("incidents"), { scroll: false });
      return;
    }
    if (isSmartGuardTourManageContactsLegacyTab(tabParam, subParam)) {
      router.replace(smartGuardTourDashboardTabHref("contacts"), { scroll: false });
    }
  }, [tabParam, subParam, router]);

  const leaf = useMemo(
    () => parseSmartGuardTourManageLeaf(tabParam, subParam),
    [tabParam, subParam],
  );
  const groupKey = smartGuardTourManageGroupForLeaf(leaf);
  const group = SMART_GUARD_TOUR_MANAGE_GROUPS.find((g) => g.key === groupKey)!;
  const activeSub = group.subs.find((s) => s.key === leaf);

  const setGroup = (key: SmartGuardTourManageGroupKey) => {
    router.replace(smartGuardTourManageHref(key), { scroll: false });
  };

  const setLeaf = (next: SmartGuardTourManageLeafKey) => {
    router.replace(smartGuardTourManageHref(next), { scroll: false });
  };

  const onEmbeddedToolbar = useCallback((api: SmartGuardTourListToolbarApi | null) => {
    setToolbar(api);
  }, []);

  const subtitle =
    group.subs.length > 0 && activeSub
      ? `${group.label} · ${activeSub.shortLabel ?? activeSub.label}`
      : group.label;

  const secondaryItems =
    group.subs.length > 0
      ? group.subs.map((s) => ({
          key: s.key,
          label: s.label,
          shortLabel: s.shortLabel ?? s.label,
        }))
      : undefined;

  return (
    <div className={smartGuardTourPageStackClass}>
      <SmartGuardTourPageSubNav
        title="การจัดการ"
        titleIcon={smartGuardTourPageTitleIcon("manage")}
        titleTone={smartGuardTourPageTitleTone("manage")}
        subtitle={subtitle}
        items={SMART_GUARD_TOUR_MANAGE_GROUPS.map((g) => ({
          key: g.key,
          label: g.shortLabel,
          icon: smartGuardTourManageGroupIcon(g.key),
        }))}
        activeKey={groupKey}
        onSelect={(k) => setGroup(k as SmartGuardTourManageGroupKey)}
        ariaLabel="เมนูหลักการจัดการ"
        secondaryItems={secondaryItems}
        secondaryActiveKey={secondaryItems ? leaf : undefined}
        onSecondarySelect={secondaryItems ? (k) => setLeaf(k as SmartGuardTourManageLeafKey) : undefined}
        secondaryAriaLabel={`หมวดย่อย ${group.label}`}
        action={
          <SmartGuardTourPageFilterAction
            toolbar={toolbar}
            leadingDivider={Boolean(secondaryItems?.length)}
          />
        }
      >
        {leaf === "staff" ? (
          <SmartGuardTourStaffPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "posts" ? (
          <SmartGuardTourPostsPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "duties" ? (
          <SmartGuardTourDutiesPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "checkpoints" ? (
          <SmartGuardTourCheckpointsPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "schedules" ? (
          <SmartGuardTourSchedulesPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "assets" ? (
          <SmartGuardTourAssetsPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
