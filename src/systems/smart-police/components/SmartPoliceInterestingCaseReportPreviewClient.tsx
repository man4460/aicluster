"use client";

import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { INTERESTING_CASE_REPORT_TEMPLATE_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  createEmptyInterestingCaseReportFields,
  type InterestingCaseReportFields,
} from "@/lib/smart-police/form-templates/interesting-case-report";
import { OfficialInterestingCaseReportDocument } from "@/systems/smart-police/components/OfficialInterestingCaseReportSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

export function SmartPoliceInterestingCaseReportPreviewClient({ caseId }: { caseId?: string } = {}) {
  const [fields, setFields] = useState<InterestingCaseReportFields>(() =>
    createEmptyInterestingCaseReportFields(),
  );
  const [pageCount, setPageCount] = useState(1);

  function patch<K extends keyof InterestingCaseReportFields>(
    key: K,
    value: InterestingCaseReportFields[K],
  ) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-[#6b7280] text-white shadow-sm">
      <header className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-600/80 bg-slate-800 px-2 py-1.5 sm:px-3">
        <Link
          href="/dashboard/smart-police/templates"
          className={cn(barBtnClass, "gap-1 px-2")}
          aria-label="กลับรายการแม่แบบ"
          title="กลับ"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          กลับ
        </Link>
        <p
          className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm"
          title={INTERESTING_CASE_REPORT_TEMPLATE_TITLE}
        >
          {INTERESTING_CASE_REPORT_TEMPLATE_TITLE}
        </p>
        <SmartPoliceCaseFillBar caseId={caseId} fields={fields} onFilled={setFields} />
        <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "ml-auto")}>
          ไปใช้ในคดี
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialInterestingCaseReportDocument
          fields={fields}
          onChange={patch}
          onPageCount={setPageCount}
        />
      </div>
      <span className="hidden">{pageCount}</span>
    </div>
  );
}
