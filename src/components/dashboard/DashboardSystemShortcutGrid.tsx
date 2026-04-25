import Link from "next/link";
import { ModuleCardCoverImage } from "@/components/dashboard/ModuleCardCoverImage";
import type { DashboardSystemCard } from "@/lib/dashboard-system-catalog";
import { resolveDashboardNavLinkHref } from "@/lib/dashboard/chat-ai-href";

export function DashboardSystemShortcutGrid({ items }: { items: DashboardSystemCard[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
        <li key={it.href}>
          <Link
            href={resolveDashboardNavLinkHref(it.href)}
            className="flex min-h-[4.5rem] flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-[#f6f4ff] hover:shadow-md sm:flex-row sm:items-center sm:gap-3 sm:p-4"
          >
            <ModuleCardCoverImage
              url={it.imageUrl}
              className="h-20 w-full shrink-0 border border-slate-200/80 sm:h-16 sm:w-24"
            />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-2xl shrink-0" aria-hidden>
                {it.emoji}
              </span>
              <span className="font-medium leading-snug text-[#2e2a58]">{it.label}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
