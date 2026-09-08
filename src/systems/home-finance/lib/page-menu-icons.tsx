import type { ReactNode } from "react";
import type { HomeFinanceCardTone } from "@/systems/home-finance/lib/card-tones";
import type { HomeFinanceOverviewSubKey } from "@/systems/home-finance/home-finance-module-nav";

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconHomeFinanceOverview({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </Svg>
  );
}

export function IconHomeFinancePasswords({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="16" r="1.25" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconHomeFinanceNotes({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M8 4h7l3 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M15 4v3h3M9 12h6M9 16h4" />
    </Svg>
  );
}

export function IconHomeFinancePrompts({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M9.5 12h5M12 9.5v5" />
    </Svg>
  );
}

export function homeFinanceOverviewSubIcon(key: HomeFinanceOverviewSubKey, className = "h-4 w-4"): ReactNode {
  switch (key) {
    case "overview":
      return <IconHomeFinanceOverview className={className} />;
    case "passwords":
      return <IconHomeFinancePasswords className={className} />;
    case "notes":
      return <IconHomeFinanceNotes className={className} />;
    case "prompts":
      return <IconHomeFinancePrompts className={className} />;
  }
}

export function homeFinanceOverviewSubTone(key: HomeFinanceOverviewSubKey): HomeFinanceCardTone {
  switch (key) {
    case "overview":
      return "emerald";
    case "passwords":
      return "indigo";
    case "notes":
      return "amber";
    case "prompts":
      return "violet";
  }
}

/** @deprecated */
export const IconHomeFinancePersonalHub = IconHomeFinanceOverview;
/** @deprecated */
export const homeFinancePersonalSubIcon = homeFinanceOverviewSubIcon;
/** @deprecated */
export const homeFinancePersonalSubTone = homeFinanceOverviewSubTone;
