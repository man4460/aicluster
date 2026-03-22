import Link from "next/link";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/cn";

type Props = {
  username: string;
  role: "USER" | "ADMIN";
  children: React.ReactNode;
};

export function DashboardShell({ username, role, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link href="/dashboard" className="min-w-0 shrink-0">
              <MawellLogo size="md" className="min-w-0" />
            </Link>
            <nav className="hidden items-center gap-1 border-l border-slate-200 pl-3 sm:flex sm:pl-4">
              <Nav href="/dashboard">แดชบอร์ด</Nav>
              {role === "ADMIN" ? <Nav href="/dashboard/admin/users">จัดการผู้ใช้</Nav> : null}
            </nav>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <nav className="flex gap-1 sm:hidden">
              <Nav href="/dashboard" small>
                หน้าหลัก
              </Nav>
              {role === "ADMIN" ? (
                <Nav href="/dashboard/admin/users" small>
                  ผู้ใช้
                </Nav>
              ) : null}
            </nav>
            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <span className="max-w-[140px] truncate text-sm text-slate-600" title={username}>
                {username}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function Nav({
  href,
  children,
  small,
}: {
  href: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
        small && "px-2 text-xs",
      )}
    >
      {children}
    </Link>
  );
}
