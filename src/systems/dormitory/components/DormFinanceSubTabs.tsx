"use client";

import { cn } from "@/lib/cn";
import { dormNavActiveClass, dormNavIdleClass } from "@/systems/dormitory/lib/ui-tokens";
import { dormFinanceSubTabShellClass } from "@/systems/dormitory/dorm-ui-tokens";

export type DormFinancePanel = "history" | "expenses";

const PANEL_TABS: { id: DormFinancePanel; label: string }[] = [
  { id: "history", label: "ประวัติ / รายรับ" },
  { id: "expenses", label: "รายจ่าย" },
];

function tabPillClass(active: boolean) {
  return cn(
    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:min-h-[44px] sm:px-3 sm:text-sm",
    active ? cn(dormNavActiveClass) : cn("ring-1 ring-transparent", dormNavIdleClass),
  );
}

type Props = {
  panel: DormFinancePanel;
  onPanelChange: (panel: DormFinancePanel) => void;
};

export function DormFinanceSubTabs({ panel, onPanelChange }: Props) {
  return (
    <nav className={dormFinanceSubTabShellClass} aria-label="เมนูการเงินหอพัก">
      <div className="flex w-full min-w-0 gap-1" role="tablist">
        {PANEL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={panel === t.id}
            id={`dorm-finance-tab-${t.id}`}
            aria-controls={`dorm-finance-panel-${t.id}`}
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
