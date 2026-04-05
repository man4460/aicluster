"use client";

import type { ReactNode } from "react";
import { AppEmptyState, AppSectionHeader } from "@/components/app-templates";
import { appDashboardHistoryListShellClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";

/** พื้นหลังรายการประวัติ (มือถือ/เดสก์ท็อป) — ค่าเดียวกับ `appDashboardHistoryListShellClass` */
export const hfHistoryListShellClass = appDashboardHistoryListShellClass;

/** การ์ดหน้าหลัก (หมวด / บิล / รถ / แจ้งเตือน) */
export const hfSectionClass =
  "space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export const hfSectionTightClass =
  "space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export function HomeFinancePageSection({
  children,
  className,
  tight,
}: {
  children: ReactNode;
  className?: string;
  tight?: boolean;
}) {
  return <div className={cn(tight ? hfSectionTightClass : hfSectionClass, className)}>{children}</div>;
}

/** หัวข้อหน้า + คำอธิบาย + ปุ่มด้านขวา (เช่น เพิ่มบิลใหม่) */
export function HomeFinanceSectionHeader(props: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return <AppSectionHeader {...props} tone="slate" />;
}

/** กล่องฟอร์มย่อย (พื้นหลังอ่อน) */
export function HomeFinanceInsetForm({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      {title ? (
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}

/** หัวข้อรายการย่อย เช่น รายการบิล (3) */
export function HomeFinanceListHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500", className)}>
      {children}
    </h3>
  );
}

export function HomeFinanceList({
  children,
  className,
  as: Tag = "div",
  listRole,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
  listRole?: string;
}) {
  return (
    <Tag className={cn("flex flex-col gap-2", className)} {...(listRole ? { "aria-label": listRole } : {})}>
      {children}
    </Tag>
  );
}

/** ว่าง — เส้นประ */
export function HomeFinanceEmptyState({ children }: { children: ReactNode }) {
  return <AppEmptyState tone="slate">{children}</AppEmptyState>;
}

/** แถวรายการ: เนื้อหาซ้าย + ปุ่มขวา (บิล / รถ / แจ้งเตือน) */
export function HomeFinanceEntityRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HomeFinanceEntityMain({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-1 items-center gap-3", className)}>{children}</div>;
}

export function HomeFinanceEntityActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-row flex-nowrap items-center justify-end gap-1.5 sm:gap-2", className)}>
      {children}
    </div>
  );
}

const rowActionBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-2 py-1.5 text-[11px] font-semibold touch-manipulation transition-colors sm:px-3 sm:text-xs";

export function HomeFinanceRowActionButton({
  variant,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  variant: "neutral" | "primary" | "muted" | "danger";
}) {
  const v =
    variant === "primary"
      ? "border-slate-200 bg-slate-50 text-[#0000BF] hover:bg-slate-100"
      : variant === "danger"
        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : variant === "muted"
          ? "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
  return <button type="button" className={cn(rowActionBase, v, className)} {...props} />;
}

/** ปุ่มหลักมุมขวาบน (เพิ่มบิล / เพิ่มรถ) */
export function HomeFinanceToolbarButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:opacity-95 sm:min-h-0",
        className,
      )}
      {...props}
    />
  );
}

/** ปุ่มหลักในโมดัล / ฟอร์ม */
export function HomeFinancePrimaryButton({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95",
        className,
      )}
      {...props}
    />
  );
}

export function HomeFinanceSecondaryButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700", className)}
      {...props}
    />
  );
}

export function HomeFinanceModalCloseTextButton({ className, onClick, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100", className)}
      onClick={onClick}
      {...props}
    />
  );
}

/** แถบ CTA ด้านบนแดชบอร์ด / ประวัติ */
export function HomeFinanceHeroCta({
  hint,
  buttonLabel,
  onAddClick,
}: {
  hint: ReactNode;
  buttonLabel: string;
  onAddClick: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-[#0000BF]/25 bg-gradient-to-br from-[#f4f4ff] to-white p-4 shadow-md sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-sm font-medium text-slate-800 sm:text-left">{hint}</p>
        <button
          type="button"
          onClick={onAddClick}
          className="h-12 w-full shrink-0 rounded-xl bg-[#0000BF] px-6 text-base font-semibold text-white shadow-sm hover:bg-[#0000a6] sm:h-11 sm:w-auto sm:min-w-[11rem] sm:text-sm"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

/** การ์ดกรองประวัติ */
export function HomeFinanceFilterCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>{children}</div>
  );
}

/** พื้นหลังโมดัล */
export function HomeFinanceModalBackdrop({
  onBackdropClick,
  children,
}: {
  onBackdropClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onBackdropClick}
      role="presentation"
    >
      {children}
    </div>
  );
}

/** กล่องโมดัล */
export function HomeFinanceModalPanel({
  title,
  titleId,
  onClose,
  error,
  children,
  maxWidthClassName = "max-w-lg",
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  error?: string | null;
  children: ReactNode;
  /** เช่น max-w-lg | max-w-3xl | max-w-4xl */
  maxWidthClassName?: string;
}) {
  return (
    <div
      className={cn(
        "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl",
        maxWidthClassName,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <HomeFinanceModalCloseTextButton onClick={onClose}>ปิด</HomeFinanceModalCloseTextButton>
      </div>
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** label + input file ซ่อน — สไตล์เดียวกับปุ่มแถว */
export function HomeFinanceUploadTrigger({
  children,
  onFile,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: {
  children: ReactNode;
  onFile: (file: File) => void;
  accept?: string;
}) {
  return (
    <label
      className={cn(
        rowActionBase,
        "cursor-pointer border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      )}
    >
      {children}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

/** @deprecated ใช้ AppImageThumb จาก @/components/app-templates */
export { AppImageThumb as HomeFinanceThumb } from "@/components/app-templates";

/** หัวข้อย่อยในแถบกรอง / การวิเคราะห์ */
export function HomeFinancePanelHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? <div className="mt-1 text-xs leading-snug text-slate-500">{description}</div> : null}
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
    </div>
  );
}
