"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const base =
  "fixed inset-x-0 bottom-0 z-[70] border-t border-white/45 bg-gradient-to-r from-white/80 via-white/70 to-[#eef2ff]/75 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl md:hidden";

type Item = { href: string; label: string; icon: (p: { className?: string }) => React.ReactNode };

const items: Item[] = [
  { href: "/dashboard/prompt-library", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/prompt-library/prompts", label: "คลัง", icon: IconSpark },
  { href: "/dashboard/prompt-library/categories", label: "หมวด", icon: IconFolders },
];

function active(path: string, href: string) {
  if (href === "/dashboard/prompt-library") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function PromptMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูล่าง คลังคำสั่ง AI" className={base}>
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-3 gap-1 rounded-[2rem] border border-white/60 bg-white/65 p-1.5 shadow-[0_12px_38px_-18px_rgba(76,70,178,0.55)] ring-1 ring-white/65">
        {items.map((item) => {
          const on = active(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold tracking-tight transition",
                  on
                    ? "bg-gradient-to-b from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_10px_20px_-12px_rgba(77,71,182,0.9)]"
                    : "text-[#66638c] hover:bg-white/70",
                )}
                aria-current={on ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        d="M12 2l2.88 7.26H22l-6.44 4.96 2.46 7.5L12 16.77l-6.02 4.95 2.46-7.5L2 9.26h7.12L12 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFolders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 7h4l2-2h10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}
