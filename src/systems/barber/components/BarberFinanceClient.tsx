"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BarberCostToolbarApi } from "@/systems/barber/components/BarberCostPanel";
import { BarberCostsClient } from "@/systems/barber/components/BarberCostsClient";
import { BarberHistoryClient } from "@/systems/barber/components/BarberHistoryClient";

type ListTab = "sales" | "costs";

function listTabFromSearch(searchParams: URLSearchParams | null): ListTab {
  return searchParams?.get("tab") === "costs" ? "costs" : "sales";
}

export function BarberFinanceClient({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [listTab, setListTab] = useState<ListTab>(() => listTabFromSearch(searchParams));
  const [costToolbar, setCostToolbar] = useState<BarberCostToolbarApi | null>(null);
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
    <BarberHistoryClient
      embedded
      financeListTab={listTab}
      onFinanceListTabChange={setFinanceListTab}
      costToolbar={costToolbar}
      costToolbarBusy={costToolbarBusy}
      costsPanel={
        <BarberCostsClient
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
