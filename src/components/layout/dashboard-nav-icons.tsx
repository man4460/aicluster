import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 opacity-90", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** ไอคอนรายการเมนู — ใช้ currentColor ตามสีลิงก์ (รวมสถานะ active) */
export function dashboardNavIconForHref(href: string): ReactNode {
  if (href === "/dashboard") {
    return (
      <Svg>
        <path
          d="M4 11L12 4l8 7v9a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/profile")) {
    return (
      <Svg>
        <path
          d="M20 21a8 8 0 00-16 0M12 11a4 4 0 100-8 4 4 0 000 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/plans")) {
    return (
      <Svg>
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/chat")) {
    return (
      <Svg>
        <path
          d="M21 12a8 8 0 01-8 8H7l-4 3v-3H5a8 8 0 118 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/admin")) {
    return (
      <Svg>
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/barber")) {
    return (
      <Svg>
        <path
          d="M6 4h12M8 4v3l2 14h4l2-14V4M10 21h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/dormitory")) {
    return (
      <Svg>
        <path
          d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v0M9 12v0M9 15v0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/attendance")) {
    return (
      <Svg>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/home-finance") || href.startsWith("/dashboard/modules/income-expense-basic")) {
    return (
      <Svg>
        <path
          d="M4 6h16M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M9 11h6M9 15h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/modules/attendance")) {
    return (
      <Svg>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/modules/")) {
    return (
      <Svg>
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      </Svg>
    );
  }
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
