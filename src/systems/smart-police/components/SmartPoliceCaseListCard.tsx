"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_CASE_PRIORITY_LABEL,
  SMART_POLICE_CASE_STATUS_LABEL,
} from "@/lib/smart-police/types";
import {
  smartPoliceListRowAccentClass,
  smartPoliceListRowClass,
} from "@/systems/smart-police/lib/ui-tokens";
import type { SmartPoliceCasePriority, SmartPoliceCaseStatus } from "@/generated/prisma/enums";

export type SmartPoliceCaseListCardData = {
  id: string;
  caseNumber: string;
  title: string;
  status: SmartPoliceCaseStatus;
  priority: SmartPoliceCasePriority;
  daysSinceReceived: number | null;
  overdue: boolean;
  complainantName: string | null;
  suspectName: string | null;
  sentToProsecutorAt: string | null;
};

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="3.5" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 21V4" strokeLinecap="round" />
      <path d="M5 4h11l-1.5 3.5L16 11H5" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function priorityTextClass(p: SmartPoliceCasePriority): string {
  if (p === "URGENT") return "text-rose-600";
  if (p === "HIGH") return "text-amber-600";
  if (p === "LOW") return "text-slate-500";
  return "text-indigo-600";
}

function statusTextClass(s: SmartPoliceCaseStatus): string {
  if (s === "OPEN") return "text-sky-600";
  if (s === "IN_PROGRESS") return "text-violet-600";
  return "text-emerald-600";
}

function elapsedLabel(days: number | null, overdue: boolean): { text: string; className: string } {
  if (days == null) {
    return { text: "ยังไม่ระบุวันรับ", className: "text-[#66638c]" };
  }
  if (days === 0) {
    return {
      text: "รับวันนี้",
      className: overdue ? "text-rose-600" : "text-[#5f5a8a]",
    };
  }
  return {
    text: `ผ่านไป ${days} วัน`,
    className: overdue ? "font-bold text-rose-600" : "text-[#5f5a8a]",
  };
}

type Props = {
  caseItem: SmartPoliceCaseListCardData;
  className?: string;
};

export function SmartPoliceCaseListCard({ caseItem: c, className }: Props) {
  const elapsed = elapsedLabel(c.daysSinceReceived, c.overdue);

  return (
    <Link
      href={`/dashboard/smart-police/cases/${c.id}`}
      className={cn(
        c.overdue ? smartPoliceListRowAccentClass("rose") : smartPoliceListRowClass,
        "items-start gap-3 sm:items-center",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="truncate text-[13px] font-bold text-[#1e1b4b] sm:text-sm">
          <span className="text-[#4d47b6]">{c.caseNumber}</span>
          <span className="mx-1.5 text-slate-300" aria-hidden>
            —
          </span>
          {c.title}
        </p>
        <p className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-[#4d47b6]">
          <IconUser className="h-3 w-3 shrink-0 opacity-80" />
          <span className="shrink-0">ผู้กล่าวหา</span>
          <span className="truncate font-semibold text-[#1e1b4b]">
            {c.complainantName?.trim() || "—"}
          </span>
        </p>
        <p className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-[#4d47b6]">
          <IconUser className="h-3 w-3 shrink-0 opacity-80" />
          <span className="shrink-0">ผู้ต้องหา</span>
          <span className="truncate font-semibold text-[#1e1b4b]">
            {c.suspectName?.trim() || "—"}
          </span>
        </p>
        <p className={cn("flex items-center gap-1 text-[11px] font-semibold", elapsed.className)}>
          <IconClock className="h-3 w-3 shrink-0" />
          <span>{elapsed.text}</span>
        </p>
      </div>

      <div
        className="flex shrink-0 flex-col items-end gap-1 self-center text-right"
        aria-label="สถานะคดี"
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold",
            priorityTextClass(c.priority),
          )}
        >
          <IconFlag className="h-3 w-3 shrink-0" />
          {SMART_POLICE_CASE_PRIORITY_LABEL[c.priority]}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold",
            statusTextClass(c.status),
          )}
        >
          <IconStatus className="h-3 w-3 shrink-0" />
          {SMART_POLICE_CASE_STATUS_LABEL[c.status]}
        </span>
        {c.sentToProsecutorAt ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <IconSent className="h-3 w-3 shrink-0" />
            ส่งอัยการแล้ว
          </span>
        ) : null}
      </div>
    </Link>
  );
}
