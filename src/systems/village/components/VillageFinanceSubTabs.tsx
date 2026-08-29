"use client";

import { cn } from "@/lib/cn";
import {
  villageFinanceSubTabShellClass,
  villageNavItemActiveClass,
  villageNavItemIdleClass,
} from "@/systems/village/village-ui-tokens";

export type VillageFinancePanel = "history" | "expenses";

const PANEL_TABS: { id: VillageFinancePanel; label: string }[] = [
  { id: "history", label: "ประวัติ / รายรับ" },
  { id: "expenses", label: "รายจ่าย" },
];

function tabPillClass(active: boolean) {
  return cn(
    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:px-3 sm:text-sm",
    active ? villageNavItemActiveClass : cn("ring-1 ring-transparent", villageNavItemIdleClass),
  );
}

type Props = {
  panel: VillageFinancePanel;
  onPanelChange: (panel: VillageFinancePanel) => void;
};

export function VillageFinanceSubTabs({ panel, onPanelChange }: Props) {
  return (
    <nav className={villageFinanceSubTabShellClass} aria-label="เมนูการเงินหมู่บ้าน">
      <div className="flex w-full min-w-0 gap-1" role="tablist">
        {PANEL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={panel === t.id}
            id={`village-finance-tab-${t.id}`}
            aria-controls={`village-finance-panel-${t.id}`}
            onClick={() => onPanelChange(t.id)}
            className={tabPillClass(panel === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
