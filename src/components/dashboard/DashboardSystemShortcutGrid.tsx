import Link from "next/link";
import type { DashboardSystemCard } from "@/lib/dashboard-system-catalog";

export function DashboardSystemShortcutGrid({ items }: { items: DashboardSystemCard[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
        <li key={it.href}>
          <Link
            href={it.href}
            className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-[#f6f4ff] hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>
              {it.emoji}
            </span>
            <span className="font-medium leading-snug text-[#2e2a58]">{it.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
