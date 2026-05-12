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
            className="group flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/55 bg-white/75 text-left shadow-[0_14px_40px_-24px_rgba(30,27,75,0.35)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#5b61ff]/30 hover:shadow-[0_22px_50px_-20px_rgba(91,97,255,0.28)] sm:rounded-[1.5rem]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#ecebff] to-indigo-100/40">
              <ModuleCardCoverImage
                url={it.imageUrl}
                className="h-full w-full rounded-none border-0 object-cover ring-0"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1222]/80 via-transparent to-transparent opacity-80"
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                <span className="text-xl drop-shadow-md" aria-hidden>
                  {it.emoji}
                </span>
                <span className="line-clamp-2 text-right text-xs font-black leading-snug text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
                  {it.label}
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
