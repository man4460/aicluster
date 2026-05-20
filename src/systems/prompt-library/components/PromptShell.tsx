"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PromptMobileDock } from "@/systems/prompt-library/components/PromptMobileDock";

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

function NavItem({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        navItemBase,
        "w-full sm:w-auto",
        active
          ? "bg-gradient-to-br from-[#ede9ff] via-white to-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
          : "app-btn-soft text-[#66638c]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}

const navLinks = [
  { href: "/dashboard/prompt-library", label: "คลังคำสั่ง", icon: IconLib },
  { href: "/dashboard/prompt-library/categories", label: "หมวดหมู่", icon: IconCat },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/prompt-library") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PromptShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b87b8]">กลุ่ม 1 · 1 โทเคน/วัน</p>
          <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">คลังคำสั่ง AI</h1>
          <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
            ค้นหา · การ์ดแยกหมวด · คัดลอกไปใช้กับ AI · ส่งออก/นำเข้า JSON
          </p>
        </div>
        <nav
          aria-label="เมนู คลังคำสั่ง AI"
          className="mt-3 hidden border-t border-white/60 pt-3 sm:mt-4 sm:pt-4 md:block"
        >
          <ul className="grid grid-cols-2 gap-2">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href} className="min-w-0">
                <NavItem href={href} icon={icon} active={navActive(pathname, href)}>
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="-mx-3 pb-24 sm:mx-0 sm:pb-0">{children}</div>
      <PromptMobileDock />
    </div>
  );
}

function IconLib({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        d="M12 2l2.88 7.26H22l-6.44 4.96 2.46 7.5L12 16.77l-6.02 4.95 2.46-7.5L2 9.26h7.12L12 2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 7h4l2-2h10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}
