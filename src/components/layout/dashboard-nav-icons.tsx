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
  if (href.startsWith("/dashboard/mqtt-service")) {
    return (
      <Svg>
        <path
          d="M12 20a2 2 0 100-4 2 2 0 000 4zM4.93 4.93l1.41 1.41M18.36 6.34l1.42-1.41M12 4V2M7.05 7.05L5.64 5.64M16.95 7.05l1.41-1.41M8 12a4 4 0 018 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/building-pos")) {
    return (
      <Svg>
        <path
          d="M3 21h18M6 21V10l6-3 6 3v11M10 21v-6h4v6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/village")) {
    return (
      <Svg>
        <path
          d="M3 21h18M5 21V12l4-2 4 2v9M15 21v-5l3-1 3 1v5M9 14h.01M9 17h.01M12 14h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/admin/activity-logs")) {
    return (
      <Svg>
        <path
          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  /* แยกไอคอนแอดมิน — อย่าให้ทุกรายการไปลงโล่ตัวเดียว */
  if (href.startsWith("/dashboard/admin/users")) {
    return (
      <Svg>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3.5 20.5v-.5a5 5 0 015-5h1a5 5 0 015 5v.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M14 20.5v-.5a3.5 3.5 0 013.2-3.48"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/admin/mqtt")) {
    return (
      <Svg>
        <path
          d="M4 7h4v10H4V7zm6-3h4v16h-4V4zm6 5h4v6h-4V9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/admin/module-cooldowns")) {
    return (
      <Svg>
        <path
          d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16M21 21v-5h-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/admin/module-cards")) {
    return (
      <Svg>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
        <path d="M13 15l3-3 2 2 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/car-wash")) {
    return (
      <Svg>
        <path
          d="M3 14l2-5h14l2 5M6 14l1 4h10l1-4M8 9l1-3h6l1 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (href === "/dashboard/admin" || href.startsWith("/dashboard/admin/")) {
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
