import type { ReactNode } from "react";

export type LoyaltyStampTabKey = "overview" | "stamp" | "qr" | "settings";

export function loyaltyStampTabIcon(key: LoyaltyStampTabKey): ReactNode {
  if (key === "overview") return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
  if (key === "stamp")
    return (
      <>
        <rect x="5" y="6" width="14" height="12" rx="2" />
        <path d="M9 10h6M9 14h4" strokeLinecap="round" />
        <circle cx="16" cy="10" r="1.25" fill="currentColor" />
      </>
    );
  if (key === "qr") return <path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />;
  return (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  );
}
