import { cn } from "@/lib/cn";
import type { AdminHubIconKey } from "@/lib/admin-hub-nav";

type Props = { name: AdminHubIconKey; className?: string };

/** ไอคอนเส้น (stroke) สไตล์เดียวกับแท็บคาร์แคร์ */
export function AdminHubMenuIcon({ name, className }: Props) {
  const stroke = 2.25;
  const common = cn("h-5 w-5 shrink-0", className);
  switch (name) {
    case "overview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "mqtt":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <path d="M4.5 16.5c1-5 4-10 7.5-10s6.5 5 7.5 10" strokeLinecap="round" />
          <path d="M9 18c.5-2.5 2-4 3-4s2.5 1.5 3 4" strokeLinecap="round" />
          <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cooldowns":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m15 5 1 2M8 17l1 2" strokeLinecap="round" />
        </svg>
      );
    case "cards":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className={common} aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M14 9h4M14 13h4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
