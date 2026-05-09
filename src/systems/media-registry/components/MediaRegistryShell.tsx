"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MediaRegistryMobileDock } from "@/systems/media-registry/components/MediaRegistryMobileDock";

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2";

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
  { href: "/dashboard/media-registry", label: "ภาพรวม", icon: IconDash },
  { href: "/dashboard/media-registry/items", label: "ทะเบียนสื่อ", icon: IconClip },
  { href: "/dashboard/media-registry/borrow", label: "ยืม-คืน", icon: IconSwap },
  { href: "/dashboard/media-registry/issues", label: "ชำรุด/ซ่อม", icon: IconWarn },
  { href: "/dashboard/media-registry/master", label: "ข้อมูลหลัก", icon: IconDb },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/media-registry") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MediaRegistryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ทะเบียนคุมสื่อ</h1>
          <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
            ทะเบียน ยืม-คืน มูลค่าและที่เก็บ · บันทึกชำรุด ซ่อม สูญหาย จำหน่าย — ออกแบบอิงระบบจัดการสื่อสำหรับสถานศึกษา
          </p>
        </div>
        <nav
          aria-label="เมนู ทะเบียนคุมสื่อ"
          className="mt-3 hidden border-t border-white/60 pt-3 sm:mt-4 sm:block sm:pt-4"
        >
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-5">
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
      <MediaRegistryMobileDock />
    </div>
  );
}

function IconDash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconClip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M9 4h6l1 3H8L9 4z" strokeLinejoin="round" />
      <path d="M8 7h8v13a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSwap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M7 8h11M7 8l3-3M7 8l3 3M17 16H6M17 16l-3 3M17 16l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWarn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 7v6M12 17h.01M10.3 4.2h3.4l8 14H2.3l8-14z" strokeLinejoin="round" />
    </svg>
  );
}

function IconDb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}
