"use client";

import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { COMPENSATION_SETTLEMENT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  createEmptyCompensationSettlementFields,
  type CompensationSettlementFields,
} from "@/lib/smart-police/form-templates/compensation-settlement";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

const OfficialCompensationSettlementDocument = dynamic(
  () =>
    import("@/systems/smart-police/components/OfficialCompensationSettlementSheet").then(
      (m) => m.OfficialCompensationSettlementDocument,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-sm font-semibold text-white/90">กำลังโหลดแบบฟอร์ม…</p>
    ),
  },
);

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

export function SmartPoliceCompensationSettlementPreviewClient({ caseId }: { caseId?: string } = {}) {
  const [fields, setFields] = useState<CompensationSettlementFields>(() =>
    createEmptyCompensationSettlementFields(),
  );

  function patch<K extends keyof CompensationSettlementFields>(
    key: K,
    value: CompensationSettlementFields[K],
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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={COMPENSATION_SETTLEMENT_FORM_TITLE}>
          {COMPENSATION_SETTLEMENT_FORM_TITLE}
        </p>
        <SmartPoliceCaseFillBar caseId={caseId} fields={fields} onFilled={setFields} />
        <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "ml-auto")}>
          ไปใช้ในคดี
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialCompensationSettlementDocument fields={fields} onChange={patch} />
      </div>
    </div>
  );
}
