"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  homeFinanceIconButtonClass,
  homeFinancePrimaryIconButtonClass,
  homeFinanceRowIconButtonClass,
} from "@/systems/home-finance/lib/ui-tokens";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" strokeLinecap="round" />
      <path
        d="M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 3.9M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z" strokeLinejoin="round" />
    </svg>
  );
}

type IconBtnProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
};

export function HomeFinanceCardIconAddButton({ label, onClick, disabled, type = "button", className }: IconBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(homeFinancePrimaryIconButtonClass, className)}
    >
      <IconPlus className="h-4 w-4" />
    </button>
  );
}

export function HomeFinanceCardIconRefreshButton({
  label,
  onClick,
  disabled,
  busy,
  type = "button",
  className,
}: IconBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-busy={busy || undefined}
      className={cn(homeFinanceIconButtonClass, className)}
    >
      <IconRefresh className={cn("h-4 w-4", busy && "animate-spin")} />
    </button>
  );
}

export function HomeFinanceCardIconSaveButton({
  label,
  onClick,
  disabled,
  busy,
  type = "button",
  className,
}: IconBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-busy={busy || undefined}
      className={cn(homeFinancePrimaryIconButtonClass, className)}
    >
      {busy ? (
        <span className="text-sm font-black leading-none" aria-hidden>
          …
        </span>
      ) : (
        <IconSave className="h-4 w-4" />
      )}
    </button>
  );
}

export function HomeFinanceCardIconFilterButton({
  onClick,
  disabled,
  expanded = false,
  filtersActive = false,
  controls,
  type = "button",
  className,
}: Omit<IconBtnProps, "label"> & {
  expanded?: boolean;
  filtersActive?: boolean;
  controls?: string;
}) {
  const label = expanded ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={expanded ? "ซ่อนกรอง" : "แสดงกรอง"}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        homeFinanceIconButtonClass,
        "relative box-border h-9 max-h-9 min-h-9 w-9 min-w-9",
        expanded && "border-[#0000BF]/45 bg-[#0000BF]/10",
        filtersActive && !expanded && "border-amber-300/80 bg-amber-50/90",
        className,
      )}
    >
      <IconFilter className="h-4 w-4" aria-hidden />
      {filtersActive && !expanded ? (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden />
      ) : null}
    </button>
  );
}

/** ปุ่มไอคอนในแถวรายละเอียดการ์ด */
export function HomeFinanceRowIconActionButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: IconBtnProps & { children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(homeFinanceRowIconButtonClass, "h-8 w-8 min-h-8 min-w-8", className)}
    >
      {children}
    </button>
  );
}

export function HomeFinanceRowIconRevealButton({
  label,
  revealed,
  onClick,
  disabled,
}: {
  label: string;
  revealed: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <HomeFinanceRowIconActionButton label={label} onClick={onClick} disabled={disabled}>
      {revealed ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
    </HomeFinanceRowIconActionButton>
  );
}

export function HomeFinanceRowIconCopyButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <HomeFinanceRowIconActionButton label={label} onClick={onClick} disabled={disabled}>
      <IconCopy className="h-4 w-4" />
    </HomeFinanceRowIconActionButton>
  );
}

export function HomeFinanceRowIconConfirmButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <HomeFinanceRowIconActionButton
      label={label}
      onClick={onClick}
      disabled={disabled}
      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    >
      <IconCheck className="h-4 w-4" />
    </HomeFinanceRowIconActionButton>
  );
}

export function HomeFinanceRowIconCancelButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <HomeFinanceRowIconActionButton label={label} onClick={onClick} disabled={disabled}>
      <IconX className="h-4 w-4" />
    </HomeFinanceRowIconActionButton>
  );
}

export function HomeFinanceCardHeaderActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex shrink-0 flex-nowrap items-center gap-1.5", className)}>{children}</div>;
}
