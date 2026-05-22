"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MassageCostToolbarApi } from "@/systems/massage/components/MassageCostPanel";
import { MassageCostsClient } from "@/systems/massage/components/MassageCostsClient";
import { MassageHistoryClient } from "@/systems/massage/components/MassageHistoryClient";

type ListTab = "sales" | "costs";

function listTabFromSearch(searchParams: URLSearchParams | null): ListTab {
  return searchParams?.get("tab") === "costs" ? "costs" : "sales";
}

export function MassageFinanceClient({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [listTab, setListTab] = useState<ListTab>(() => listTabFromSearch(searchParams));
  const [costToolbar, setCostToolbar] = useState<MassageCostToolbarApi | null>(null);
  const [costToolbarBusy, setCostToolbarBusy] = useState(true);

  useEffect(() => {
    setListTab(listTabFromSearch(searchParams));
  }, [searchParams]);

  const setFinanceListTab = useCallback(
    (next: ListTab) => {
      setListTab(next);
      const q = next === "costs" ? "?tab=costs" : "";
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [pathname, router],
  );

  return (
    <MassageHistoryClient
      embedded
      financeFilterTitle={
        <h2 className="text-lg font-black leading-tight tracking-tight sm:text-xl">
          <span className="bg-gradient-to-r from-[#4338ca] via-[#5b61ff] to-[#0d9488] bg-clip-text text-transparent">
            การเงิน
          </span>
        </h2>
      }
      financeListTab={listTab}
      onFinanceListTabChange={setFinanceListTab}
      costToolbar={costToolbar}
      costToolbarBusy={costToolbarBusy}
      costsPanel={
        <MassageCostsClient
          baseUrl={baseUrl}
          embedded
          hideEmbeddedToolbar
          onToolbarReady={setCostToolbar}
          onBusyChange={setCostToolbarBusy}
        />
      }
    />
  );
}
