import Link from "next/link";
import { AdminHubMenuIcon } from "@/components/admin/AdminHubMenuIcons";
import { ADMIN_HUB_NAV_ITEMS } from "@/lib/admin-hub-nav";
import { cn } from "@/lib/cn";

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminHubHomePage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">เครื่องมือหลัก</h2>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {ADMIN_HUB_NAV_ITEMS.map((item, index) => (
          <li
            key={item.href}
            className={cn(
              "min-w-0",
              ADMIN_HUB_NAV_ITEMS.length % 2 === 1 &&
                index === ADMIN_HUB_NAV_ITEMS.length - 1 &&
                "col-span-2 lg:col-span-1",
            )}
          >
            <Link
              href={item.href}
              className={cn(
                "group flex min-h-[5.5rem] items-stretch justify-between gap-3 overflow-hidden rounded-[1.25rem] border border-white/55 p-4 text-left shadow-[0_16px_40px_-28px_rgba(30,27,75,0.35)] transition-all duration-300 sm:min-h-[6rem] sm:rounded-[2rem] sm:p-5",
                "bg-gradient-to-br from-white/60 via-white/35 to-indigo-50/25 backdrop-blur-xl ring-1 ring-inset ring-white/50",
                "hover:-translate-y-1 hover:border-[#5b61ff]/25 hover:shadow-[0_22px_48px_-24px_rgba(79,70,229,0.35)] active:scale-[0.99]",
              )}
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-[#5b61ff] shadow-sm",
                    "transition-colors group-hover:border-[#5b61ff]/20 group-hover:bg-white",
                  )}
                >
                  <AdminHubMenuIcon name={item.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block font-black leading-snug text-[#1e1b4b] sm:text-[15px]">{item.label}</span>
                  <span className="mt-1 line-clamp-2 text-xs leading-snug text-[#5f5a8a]">{item.description}</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end justify-center text-[#4d47b6]/40 transition-colors group-hover:text-[#5b61ff]">
                <ChevronRight className="h-5 w-5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
