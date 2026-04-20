import Link from "next/link";

const buildingPosDashboardBackLinkClass =
  "app-btn-soft inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2e2a58] print:hidden";

export function BuildingPosDashboardBackLink() {
  return (
    <Link href="/dashboard/building-pos" className={buildingPosDashboardBackLinkClass}>
      ← แดชบอร์ด
    </Link>
  );
}
