"use client";

import { useCallback, useState } from "react";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import {
  SmartGuardTourPageFilterAction,
  type SmartGuardTourListToolbarApi,
} from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";
import {
  SmartGuardTourFinancePanel,
  useSmartGuardCatalog,
} from "@/systems/smart-guard-tour/components/SmartGuardTourCatalogLists";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import { smartGuardTourPageStackClass } from "@/systems/smart-guard-tour/lib/ui-tokens";

export function SmartGuardTourFinanceClient({ initialShop: _shop }: { initialShop: SmartGuardShopDto }) {
  const { data, notice } = useSmartGuardCatalog();
  const [toolbar, setToolbar] = useState<SmartGuardTourListToolbarApi | null>(null);

  const onEmbeddedToolbar = useCallback((api: SmartGuardTourListToolbarApi | null) => {
    setToolbar(api);
  }, []);

  return (
    <div className={smartGuardTourPageStackClass}>
      {notice.popup}
      <SmartGuardTourPageSubNav
        title="การเงิน"
        titleIcon={smartGuardTourPageTitleIcon("finance")}
        titleTone={smartGuardTourPageTitleTone("finance")}
        action={<SmartGuardTourPageFilterAction toolbar={toolbar} />}
      >
        <SmartGuardTourFinancePanel
          ledger={data.ledger}
          summary={data.financeSummary}
          onEmbeddedToolbar={onEmbeddedToolbar}
        />
      </SmartGuardTourPageSubNav>
    </div>
  );
}
