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

const rowActionIconBase =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border touch-manipulation transition-colors sm:h-8 sm:w-8";

/** ปุ่มไอคอนในแถวการ์ด (เช่น รถ) — ต้องมี title / aria-label ชัดเจน */
export function HomeFinanceRowActionIconButton({
  variant,
  title,
  "aria-label": ariaLabel,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  variant: "primary" | "muted" | "danger";
  title: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  const v =
    variant === "primary"
      ? "border-slate-200 bg-slate-50 text-[#0000BF] hover:bg-slate-100"
      : variant === "danger"
        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100";
  const label = ariaLabel ?? title;
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      className={cn(rowActionIconBase, v, className)}
      {...props}
    >
      {children}
    </button>
  );
}

function HfRowSvg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex text-current [&>svg]:h-4 [&>svg]:w-4", className)} aria-hidden>
      {children}
    </span>
  );
}

/** ไอคอนแก้ไข — ใช้ใน HomeFinanceRowActionIconButton */
export function HomeFinanceRowIconEdit() {
  return (
    <HfRowSvg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.85} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    </HfRowSvg>
  );
}

export function HomeFinanceRowIconTrash() {
  return (
    <HfRowSvg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.85} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
      </svg>
    </HfRowSvg>
  );
}

/** ปิดใช้งาน — ลบในวงกลม */
export function HomeFinanceRowIconDeactivate() {
  return (
    <HfRowSvg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.85} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
      </svg>
    </HfRowSvg>
  );
}

/** เปิดใช้งาน — บวกในวงกลม */
export function HomeFinanceRowIconActivate() {
  return (
    <HfRowSvg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.85} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6M9 12h6" />
      </svg>
    </HfRowSvg>
  );
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

function HfIconCameraUpload({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

/**
 * รูปปก + ปุ่มกลมอัปโหลดมุมขวาล่าง — ใช้กับรถ (หน้าปก) และบิลค่าไฟ/น้ำ (รูปอ้างอิง/สลิป)
 */
export function HomeFinanceVehicleCoverUpload({
  photoUrl,
  onOpenPhoto,
  onFile,
  busy = false,
  disabled = false,
  emptyLabel = "ไม่มีรูป",
  idleUploadLabel = "อัปโหลดรูปหน้าปก",
  busyUploadLabel = "กำลังอัปโหลดรูปหน้าปก",
}: {
  photoUrl: string | null | undefined;
  onOpenPhoto: () => void;
  onFile: (file: File) => void;
  busy?: boolean;
  disabled?: boolean;
  /** ข้อความในกล่องเมื่อยังไม่มีรูป */
  emptyLabel?: string;
  /** title + sr-only เมื่อพร้อมอัปโหลด */
  idleUploadLabel?: string;
  /** title + sr-only ขณะอัปโหลด */
  busyUploadLabel?: string;
}) {
  const off = disabled || busy;
  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-16 sm:w-16">
      {photoUrl ? (
        <button
          type="button"
          onClick={onOpenPhoto}
          className="flex h-full w-full overflow-hidden rounded-xl ring-2 ring-slate-100 transition hover:ring-[#0000BF]/35"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" className="h-full w-full object-cover object-center" />
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 px-1 text-center text-[9px] leading-tight text-slate-400 ring-2 ring-slate-100">
          {emptyLabel}
        </div>
      )}
      <label
        title={busy ? busyUploadLabel : idleUploadLabel}
        className={cn(
          "absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#0000BF] text-white shadow-md transition hover:opacity-95 active:scale-[0.97] touch-manipulation",
          off && "pointer-events-none cursor-not-allowed opacity-50",
        )}
      >
        {busy ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            aria-hidden
          />
        ) : (
          <HfIconCameraUpload className="h-4 w-4" />
        )}
        <span className="sr-only">{busy ? busyUploadLabel : idleUploadLabel}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={off}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );
}

/** label + input file ซ่อน — สไตล์เดียวกับปุ่มแถว */
export function HomeFinanceUploadTrigger({
  children,
  onFile,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  disabled = false,
  busy = false,
}: {
  children: ReactNode;
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <label
      className={cn(
        rowActionBase,
        "border-slate-200 bg-slate-50 text-slate-700",
        disabled || busy
          ? "cursor-not-allowed opacity-65"
          : "cursor-pointer hover:bg-slate-100",
      )}
    >
      {busy ? <span className="tabular-nums">กำลังอัปโหลด…</span> : children}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || busy}
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
