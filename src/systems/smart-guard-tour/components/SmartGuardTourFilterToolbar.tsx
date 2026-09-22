"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  smartGuardTourInlineSubNavBtnClass,
  smartGuardTourInlineSubNavShellClass,
  smartGuardTourNavDividerClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

export type SmartGuardTourListToolbarApi = {
  /** false = โชว์แค่ extra (ปุ่มเพิ่ม) ในแถวเมนู โดยไม่มีปุ่มกรอง */
  showFilter?: boolean;
  filterOpen?: boolean;
  hasActiveFilters?: boolean;
  filterId?: string;
  toggleFilter?: () => void;
  /** ปุ่มเพิ่ม / แอ็กชันอื่นในแถวเมนู (หลังปุ่มกรอง) */
  extra?: ReactNode;
};

function IconFilterFunnel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

/** ปุ่มแสดง/ซ่อนกรอง — ใช้ในแถวเมนูย่อย (คู่แท็บ) */
export function SmartGuardTourFilterToggleButton({
  filterOpen,
  hasActiveFilters,
  filterId,
  onToggle,
  disabled,
}: {
  filterOpen: boolean;
  hasActiveFilters: boolean;
  filterId: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        smartGuardTourInlineSubNavBtnClass(filterOpen),
        "relative",
        hasActiveFilters && !filterOpen && "ring-1 ring-amber-300/80",
      )}
      title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
      aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
      aria-expanded={filterOpen}
      aria-controls={filterId}
      disabled={disabled}
      onClick={onToggle}
    >
      <IconFilterFunnel className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
      {hasActiveFilters && !filterOpen ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

/** กลุ่มปุ่มกรอง / เพิ่ม สำหรับ slot `action` ของ PageSubNav */
export function SmartGuardTourPageFilterAction({
  toolbar,
  leading,
  leadingDivider = false,
}: {
  toolbar: SmartGuardTourListToolbarApi | null;
  /** เช่นปุ่มกลับภาพรวม */
  leading?: ReactNode;
  /** เส้นบางก่อนกลุ่มกรอง/เพิ่ม เมื่อมีเมนูหลัก/ย่อยทางซ้ายแล้ว */
  leadingDivider?: boolean;
}) {
  const showFilter = Boolean(
    toolbar &&
      toolbar.showFilter !== false &&
      toolbar.toggleFilter &&
      toolbar.filterId,
  );
  const hasExtra = Boolean(toolbar?.extra);
  if (!toolbar && !leading) return null;
  if (!leading && toolbar && !showFilter && !hasExtra) return null;

  const tools =
    toolbar && (showFilter || hasExtra) ? (
      <div className={smartGuardTourInlineSubNavShellClass}>
        {showFilter ? (
          <SmartGuardTourFilterToggleButton
            filterOpen={toolbar.filterOpen ?? false}
            hasActiveFilters={toolbar.hasActiveFilters ?? false}
            filterId={toolbar.filterId!}
            onToggle={toolbar.toggleFilter!}
          />
        ) : null}
        {toolbar.extra}
      </div>
    ) : null;

  const needDividerBeforeTools = Boolean(tools) && (leadingDivider || Boolean(leading));

  return (
    <>
      {leading}
      {needDividerBeforeTools ? <span className={smartGuardTourNavDividerClass} aria-hidden /> : null}
      {tools}
    </>
  );
}
