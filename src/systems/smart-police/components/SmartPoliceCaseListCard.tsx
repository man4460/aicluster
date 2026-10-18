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

function elapsedText(days: number | null): string {
  if (days == null) return "ยังไม่ระบุวันรับ";
  if (days === 0) return "รับวันนี้";
  return `ผ่านไป ${days} วัน`;
}

type Props = {
  caseItem: SmartPoliceCaseListCardData;
  className?: string;
};

export function SmartPoliceCaseListCard({ caseItem: c, className }: Props) {
  const complainant = c.complainantName?.trim() || "—";
  const suspect = c.suspectName?.trim() || "—";

  return (
    <Link
      href={`/dashboard/smart-police/cases/${c.id}`}
      className={cn(
        c.overdue ? smartPoliceListRowAccentClass("rose") : smartPoliceListRowClass,
        "items-center gap-2 sm:gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="truncate text-[13px] font-bold leading-snug text-[#1e1b4b] sm:text-sm">
          <span className="text-[#4d47b6]">{c.caseNumber}</span>
          <span className="mx-1.5 text-slate-300" aria-hidden>
            —
          </span>
          {c.title}
        </p>
        <p className="flex min-w-0 items-center gap-x-1.5 truncate text-[11px] font-medium leading-snug text-[#66638c]">
          <span className="min-w-0 truncate">
            <span className="text-[#4d47b6]">ผู้กล่าวหา</span>{" "}
            <span className="font-semibold text-[#1e1b4b]">{complainant}</span>
            <span className="mx-1 text-slate-300" aria-hidden>
              ·
            </span>
            <span className="text-[#4d47b6]">ผู้ต้องหา</span>{" "}
            <span className="font-semibold text-[#1e1b4b]">{suspect}</span>
          </span>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 font-semibold",
              c.overdue ? "text-rose-600" : "text-[#5f5a8a]",
            )}
          >
            <IconClock className="h-3 w-3" />
            {elapsedText(c.daysSinceReceived)}
          </span>
        </p>
      </div>

      <div
        className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right"
        aria-label="สถานะคดี"
      >
        <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-bold",
              priorityTextClass(c.priority),
            )}
          >
            <IconFlag className="h-3 w-3 shrink-0" />
            {SMART_POLICE_CASE_PRIORITY_LABEL[c.priority]}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-bold",
              statusTextClass(c.status),
            )}
          >
            <IconStatus className="h-3 w-3 shrink-0" />
            {SMART_POLICE_CASE_STATUS_LABEL[c.status]}
          </span>
        </span>
        {c.sentToProsecutorAt ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
            <IconSent className="h-3 w-3 shrink-0" />
            ส่งอัยการ
          </span>
        ) : null}
      </div>
    </Link>
  );
}
