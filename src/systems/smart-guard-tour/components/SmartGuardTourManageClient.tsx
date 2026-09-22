"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SMART_GUARD_TOUR_MANAGE_GROUPS,
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
import {
  SmartGuardTourAssetsList,
  SmartGuardTourCheckpointsList,
  SmartGuardTourContactsList,
  SmartGuardTourSchedulesList,
  useSmartGuardCatalog,
} from "@/systems/smart-guard-tour/components/SmartGuardTourCatalogLists";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourManageGroupIcon,
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import {
  smartGuardTourPageStackClass,
  smartGuardTourPrimaryTabPillClass,
  smartGuardTourPrimaryTabShellClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

export function SmartGuardTourManageClient({ initialShop: _shop }: { initialShop: SmartGuardShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const subParam = searchParams.get("sub");
  const { data, notice } = useSmartGuardCatalog();
  const [toolbar, setToolbar] = useState<SmartGuardTourListToolbarApi | null>(null);

  useEffect(() => {
    if (!isSmartGuardTourManageIncidentsLegacyTab(tabParam)) return;
    router.replace(smartGuardTourDashboardTabHref("incidents"), { scroll: false });
  }, [tabParam, router]);

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

  return (
    <div className={smartGuardTourPageStackClass}>
      {notice.popup}
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
        mobileSelect={false}
        action={<SmartGuardTourPageFilterAction toolbar={toolbar} />}
      >
        {group.subs.length > 0 ? (
          <nav
            className={`${smartGuardTourPrimaryTabShellClass} mb-3`}
            role="tablist"
            aria-label={`หมวดย่อย ${group.label}`}
          >
            {group.subs.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={leaf === s.key}
                className={smartGuardTourPrimaryTabPillClass(leaf === s.key)}
                onClick={() => setLeaf(s.key)}
              >
                {s.shortLabel ?? s.label}
              </button>
            ))}
          </nav>
        ) : null}

        {leaf === "staff" ? (
          <SmartGuardTourStaffPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "posts" ? (
          <SmartGuardTourPostsPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "duties" ? (
          <SmartGuardTourDutiesPanel key={leaf} onEmbeddedToolbar={onEmbeddedToolbar} />
        ) : leaf === "checkpoints" ? (
          <SmartGuardTourCheckpointsList
            key={leaf}
            rows={data.checkpoints}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : leaf === "schedules" ? (
          <SmartGuardTourSchedulesList
            key={leaf}
            rows={data.schedules}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : leaf === "contacts" ? (
          <SmartGuardTourContactsList
            key={leaf}
            rows={data.contacts}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : leaf === "assets" ? (
          <SmartGuardTourAssetsList
            key={leaf}
            rows={data.assets}
            onEmbeddedToolbar={onEmbeddedToolbar}
          />
        ) : null}
      </SmartGuardTourPageSubNav>
    </div>
  );
}
