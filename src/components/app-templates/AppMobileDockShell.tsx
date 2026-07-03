import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  appMobileDockBackdropClass,
  appMobileDockPillClass,
  appMobileDockUnifiedSlotClass,
} from "@/components/app-templates/mobile-dock-tokens";

type Props = {
  ariaLabel: string;
  children: ReactNode;
  slot?: ReactNode;
  className?: string;
  pillClassName?: string;
};

/** โครงเมนูล่างมาตรฐาน — พื้นขาวเต็มจอ + กล่องเมนูโค้งมนด้านใน */
export function AppMobileDockShell({ ariaLabel, children, slot, className, pillClassName }: Props) {
  return (
    <nav aria-label={ariaLabel} className={cn(appMobileDockBackdropClass, className)}>
      {slot ? <div className={appMobileDockUnifiedSlotClass}>{slot}</div> : null}
      <div className={cn(appMobileDockPillClass, pillClassName)}>{children}</div>
    </nav>
  );
}

/** แถบล่างรวม (div) สำหรับโมดูลที่มีสล็อต + เมนู — เช่น POS เครื่องดื่ม */
export function AppMobileDockUnifiedBar({
  ariaLabel,
  children,
  slot,
  className,
  pillClassName,
}: Props) {
  return (
    <div
      role="navigation"
      aria-label={ariaLabel}
      className={cn(appMobileDockBackdropClass, className)}
    >
      {slot ? <div className={appMobileDockUnifiedSlotClass}>{slot}</div> : null}
      <div className={cn(appMobileDockPillClass, pillClassName)}>{children}</div>
    </div>
  );
}
