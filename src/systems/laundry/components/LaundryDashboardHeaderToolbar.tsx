"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryCheckInModal } from "@/systems/laundry/components/LaundryCheckInModal";
import { LaundryDashboardSubNavInline } from "@/systems/laundry/components/LaundryDashboardSubNavInline";
import { LaundryRefreshButton } from "@/systems/laundry/components/LaundryRefreshButton";
import { LaundrySellPackageModal } from "@/systems/laundry/components/LaundrySellPackageModal";
import { LAUNDRY_BASE, LAUNDRY_STAFF_PATH } from "@/systems/laundry/laundry-module-nav";
import {
  laundryHeaderActionBtnClass,
  laundryStaffNavDividerClass,
  laundryToolbarRowClass,
} from "@/systems/laundry/lib/ui-tokens";

function IconDeduct({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPackageSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.5 4.21 9 5.19M7.5 19.79V14.6L3 12M21 12l-4.5 2.6v5.19M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ปุ่มหักแพ็ก/ขายแพ็ก + โมดัล — ใช้ในแถบเมนูพนักงานหรือหัวการ์ดแดชบอร์ด */
export function LaundryDashboardQuickActions({
  className,
  staffQrLanding = false,
  showLabels = true,
}: {
  className?: string;
  staffQrLanding?: boolean;
  showLabels?: boolean;
}) {
  const router = useRouter();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [deductSuccessMsg, setDeductSuccessMsg] = useState<string | null>(null);

  const finishDeductAndGoOverview = useCallback(() => {
    setDeductSuccessMsg(null);
    setCheckInOpen(false);
    router.replace(staffQrLanding ? LAUNDRY_STAFF_PATH : LAUNDRY_BASE, { scroll: false });
    router.refresh();
  }, [router, staffQrLanding]);

  return (
    <>
      <div className={cn(laundryToolbarRowClass, className)}>
        <button
          type="button"
          onClick={() => setCheckInOpen(true)}
          className={laundryHeaderActionBtnClass("deduct")}
          aria-label="หักแพ็กสมาชิก"
          title="หักแพ็ก"
        >
          <IconDeduct className="h-4 w-4 shrink-0" />
          {showLabels ?
            <span className="hidden sm:inline">หักแพ็ก</span>
          : null}
        </button>
        <button
          type="button"
          onClick={() => setSellOpen(true)}
          className={laundryHeaderActionBtnClass("sell")}
          aria-label="ขายแพ็กเหมา"
          title="ขายแพ็ก"
        >
          <IconPackageSpark className="h-4 w-4 shrink-0" />
          {showLabels ?
            <span className="hidden sm:inline">ขายแพ็ก</span>
          : null}
        </button>
      </div>

      <LaundryCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onRequestSell={() => {
          setCheckInOpen(false);
          setSellOpen(true);
        }}
        onDeductSuccess={({ remainingSessions, packageName }) => {
          setCheckInOpen(false);
          setDeductSuccessMsg(
            `หักแพ็ก "${packageName}" สำเร็จ\nเหลือ ${remainingSessions.toLocaleString("th-TH")} ครั้ง`,
          );
        }}
      />
      <LaundrySellPackageModal open={sellOpen} onClose={() => setSellOpen(false)} />

      {deductSuccessMsg ?
        <AppNoticePopup
          open
          tone="success"
          title="หักแพ็กสำเร็จ"
          message={deductSuccessMsg}
          confirmLabel="ตกลง"
          autoCloseMs={0}
          onClose={finishDeductAndGoOverview}
        />
      : null}
    </>
  );
}

/**
 * แถบหัวแดชบอร์ด — ลำดับเดียวกับหน้าพนักงาน:
 * หักแพ็ก · ขายแพ็ก → แท็บย่อย → รีเฟรช
 */
export function LaundryDashboardHeaderToolbar({
  className,
  hideSubNav = false,
  staffQrLanding = false,
  refreshing = false,
  onRefresh,
}: {
  className?: string;
  /** ซ่อนแท็บย่อยแดชบอร์ด (ใช้ในโหมดพนักงาน — มีเมนูใน shell แล้ว) */
  hideSubNav?: boolean;
  staffQrLanding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  if (staffQrLanding) return null;

  return (
    <div className={cn(laundryToolbarRowClass, className)}>
      <LaundryDashboardQuickActions staffQrLanding={staffQrLanding} />
      {!hideSubNav ?
        <>
          <span className={cn(laundryStaffNavDividerClass, "hidden sm:block")} aria-hidden />
          <LaundryDashboardSubNavInline />
        </>
      : null}
      {onRefresh ?
        <>
          <span className={cn(laundryStaffNavDividerClass, "hidden sm:block")} aria-hidden />
          <LaundryRefreshButton
            refreshing={refreshing}
            onClick={() => void onRefresh()}
            ariaLabel="รีเฟรชข้อมูล"
            title="รีเฟรช"
          />
        </>
      : null}
    </div>
  );
}
