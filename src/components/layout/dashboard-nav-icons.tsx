import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isChatAiDashboardPath } from "@/lib/dashboard/chat-ai-href";

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
  if (isChatAiDashboardPath(href)) {
    return (
      <Svg>
        <path
          d="M12 3a6 6 0 00-3.8 10.6L4 22l4.3-1.1A6 6 0 1012 3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 9.5h.01M12 8.5h.01M14.5 9.5h.01M8.5 12.5a3.5 3.5 0 007 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href === "/dashboard/chat" || href.startsWith("/dashboard/chat/")) {
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
  if (href.startsWith("/dashboard/drink-pos")) {
    return (
      <Svg>
        <path
          d="M8 3h8l1 4H7l1-4zM6 7h12v2a5 5 0 01-5 5 5 5 0 01-5-5V7z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 14v4M12 14v4M15 14v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/hotel-resort")) {
    return (
      <Svg>
        <path d="M4 10V20h16V10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 20h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10V6a2 2 0 012-2h8a2 2 0 012 2v4" stroke="currentColor" strokeWidth="2" />
        <path d="M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/general-store-pos")) {
    return (
      <Svg>
        <path
          d="M6 8h15l-1.5 9H7.5L6 8zM6 8L5 3H2M9 11v5M15 11v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21a1 1 0 002 0M16 21a1 1 0 002 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/smart-police")) {
    return (
      <Svg>
        <path
          d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12h6M12 9v6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/ecommerce-store")) {
    return (
      <Svg>
        <path
          d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10M14 7h.01M10 7h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
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
  if (href.startsWith("/dashboard/football-turf")) {
    return (
      <Svg>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 3v18M3 12h18M5.5 6.5c2 1.5 4.2 2.3 6.5 2.3s4.5-.8 6.5-2.3M5.5 17.5c2-1.5 4.2-2.3 6.5-2.3s4.5.8 6.5 2.3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/lms")) {
    return (
      <Svg>
        <path
          d="M22 10L12 5 2 10l10 5 10-5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M22 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/club-event")) {
    return (
      <Svg>
        <path d="M12 3l8 4v10l-8 4-8-4V7l8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/pro-resume")) {
    return (
      <Svg>
        <path d="M6 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/laundry")) {
    return (
      <Svg>
        <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
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
  if (href.startsWith("/dashboard/massage")) {
    return (
      <Svg>
        <path
          d="M8 12c2-2 6-2 8 0M7 16c3-3 7-3 10 0M9 8a3 3 0 016 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
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
  /** EduCare — หนังสือ (เช็คนักเรียน / การศึกษา) */
  if (href.startsWith("/dashboard/educare")) {
    return (
      <Svg>
        <path
          d="M4 19.5A2.5 2.5 0 016.5 17H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  /** สารบรรณดิจิทัล — ซอง+ลูกศรไปกลับ (รับ-ส่งหนังสือ) */
  if (href.startsWith("/dashboard/doc-transmission")) {
    return (
      <Svg>
        <path
          d="M3 8l9-5 9 5M3 8v11a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9 6 9-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 14l-2 2 2 2M16 14l2 2-2 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  /** คลังคำสั่ง AI — ดาว (prompt templates) */
  if (href.startsWith("/dashboard/prompt-library")) {
    return (
      <Svg>
        <path
          d="M12 2l2.88 7.26H22l-6.44 4.96 2.46 7.5L12 16.77l-6.02 4.95 2.46-7.5L2 9.26h7.12L12 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }
  /** ทะเบียนคุมสื่อ — ฟิล์ม / แผ่น */
  if (href.startsWith("/dashboard/media-registry")) {
    return (
      <Svg>
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path d="M2 9h20" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="15" r="2" fill="currentColor" />
        <path d="M14 14h4M14 17h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    );
  }
  /** บริหารทรัพย์สิน — กล่อง/แพ็กเกจซ้อน (สินค้าคงคลัง) */
  if (href.startsWith("/dashboard/asset")) {
    return (
      <Svg>
        <path
          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  /** คลังรหัสผ่าน — แม่กุญแจ */
  if (href.startsWith("/dashboard/vault")) {
    return (
      <Svg>
        <circle cx="8" cy="11" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M10.5 13L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M17 18l2 2M15.5 19.5L18 22M18.5 16.5L21 19"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  /** คลังสต๊อกสินค้า — พาเลท/ชั้นวางสต๊อก */
  if (href.startsWith("/dashboard/inventory")) {
    return (
      <Svg>
        <path d="M3 7h18M3 12h18M3 17h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 4v3M12 4v3M19 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M17 17v4h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  /** บริการรับฝากจอดรถ — ซิลูเอตรถ + ล้อ (สอดคล้องโมดูลจอดรถ) */
  if (href.startsWith("/dashboard/parking")) {
    return (
      <Svg>
        <path
          d="M3 14h2l2-3h10l2 3h2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M5 14l1.5-5h11L19 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  /** สะสมแต้มดิจิทัล — การ์ดสมาชิก */
  if (href.startsWith("/dashboard/loyalty-stamp")) {
    return (
      <Svg>
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="9" r="1.5" fill="currentColor" />
      </Svg>
    );
  }
  /** จองคิวอัจฉริยะ — ปฏิทิน + คิว */
  if (href.startsWith("/dashboard/appointment-queue")) {
    return (
      <Svg>
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" />
      </Svg>
    );
  }
  /** คิวหน้าร้าน — บัตรคิว + เส้นลำดับ */
  if (href.startsWith("/dashboard/wait-queue")) {
    return (
      <Svg>
        <path
          d="M7 3h10a2 2 0 012 2v3a1.5 1.5 0 01-1 1.32V19a2 2 0 01-2 2H8a2 2 0 01-2-2v-9.68A1.5 1.5 0 015 10V5a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 9h6M9 13h5M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  /** ธนาคารโรงเรียน — ไม่พึ่ง `/dashboard/modules/school-bank` เพื่อให้ไอคอนตรงกับลิงก์ canonical */
  if (href.startsWith("/dashboard/school-bank")) {
    return (
      <Svg>
        <path
          d="M4 10h16v10H4V10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href.startsWith("/dashboard/community-coop")) {
    return (
      <Svg>
        <circle cx="9" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="15" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
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
  if (href === "/dashboard/systems") {
    return (
      <Svg>
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M15 8h5M15 12h5M15 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (href === "/dashboard/modules") {
    return (
      <Svg>
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
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
