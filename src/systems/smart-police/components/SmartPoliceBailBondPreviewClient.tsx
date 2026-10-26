"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { BAIL_BOND_TEMPLATE_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  BAIL_BOND_APPOINT_DEFAULT,
  BAIL_BOND_ASSET_DEFAULT,
  addBailBondAppointRow,
  addBailBondAssetRow,
  createEmptyBailBondFields,
  removeLastBailBondAppointRow,
  removeLastBailBondAssetRow,
  type BailBondFields,
} from "@/lib/smart-police/form-templates/bail-bond";
import { OfficialBailBondDocument } from "@/systems/smart-police/components/OfficialBailBondSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";
import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

export function SmartPoliceBailBondPreviewClient({ caseId }: { caseId?: string } = {}) {
  const [fields, setFields] = useState<BailBondFields>(() => createEmptyBailBondFields());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(2);

  function patch<K extends keyof BailBondFields>(key: K, value: BailBondFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function goToPage(i: number) {
    setPageIndex(i);
    document.querySelector(`[data-sheet-index="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onPageCount(n: number) {
    setPageCount(n);
    setPageIndex((i) => Math.min(i, Math.max(0, n - 1)));
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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={BAIL_BOND_TEMPLATE_TITLE}>
          {BAIL_BOND_TEMPLATE_TITLE}
        </p>
        <nav className="flex min-w-0 flex-wrap items-center gap-1" aria-label="หน้าเอกสาร">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={`p-${i}`}
              type="button"
              className={cn(
                "h-8 min-w-8 shrink-0 rounded-md px-1.5 text-xs font-bold tabular-nums",
                i === pageIndex ? "bg-white text-[#4d47b6]" : "bg-slate-700 text-slate-200 hover:bg-slate-600",
              )}
              aria-current={i === pageIndex ? "page" : undefined}
              aria-label={`หน้า ${i + 1}`}
              title={`หน้า ${i + 1}`}
              onClick={() => goToPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </nav>
        <button type="button" className={barBtnClass} onClick={() => patch("appointRows", addBailBondAppointRow(fields.appointRows))}>
          + แถวนัด
        </button>
        <button
          type="button"
          className={barBtnClass}
          disabled={fields.appointRows.length <= BAIL_BOND_APPOINT_DEFAULT}
          onClick={() => patch("appointRows", removeLastBailBondAppointRow(fields.appointRows))}
        >
          − แถวนัด
        </button>
        <button type="button" className={barBtnClass} onClick={() => patch("assetRows", addBailBondAssetRow(fields.assetRows))}>
          + แถวทรัพย์
        </button>
        <button
          type="button"
          className={barBtnClass}
          disabled={fields.assetRows.length <= BAIL_BOND_ASSET_DEFAULT}
          onClick={() => patch("assetRows", removeLastBailBondAssetRow(fields.assetRows))}
        >
          − แถวทรัพย์
        </button>
        <SmartPoliceCaseFillBar
          caseId={caseId}
          fields={fields}
          onFilled={setFields}
        />
        <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "ml-auto")}>
          ไปใช้ในคดี
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialBailBondDocument fields={fields} onChange={patch} onPageCount={onPageCount} />
      </div>
    </div>
  );
}
