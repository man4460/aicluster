"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  appendContinuationSheetPair,
  createDefaultStatementPages,
  getStatementTemplateMeta,
  normalizeStatementHeader,
  removeStatementPageAt,
  statementPageTabLabel,
  type StatementHeaderFields,
  type StatementPage,
  type StatementTemplateSlug,
} from "@/lib/smart-police/form-templates";
import { OfficialStatementFormSheet } from "@/systems/smart-police/components/OfficialStatementFormSheet";
import {
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
} from "@/systems/smart-police/lib/ui-tokens";

const toolbarBtnClass =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-500 bg-slate-700 px-3 text-sm font-semibold text-white hover:bg-slate-600";

/**
 * ดู/ทดลองพิมพ์บนแม่แบบราชการ (PNG + ช่องทับ) — จากหน้า /templates
 */
export function SmartPoliceStatementTemplatePreviewClient({ slug }: { slug: StatementTemplateSlug }) {
  const meta = getStatementTemplateMeta(slug);
  const [header, setHeader] = useState<StatementHeaderFields>(() =>
    normalizeStatementHeader({
      partyRoleLabel:
        slug === "statement-suspect" ? "ผู้ต้องหา" : slug === "statement-witness" ? "พยาน" : "ผู้กล่าวหา",
      relationshipNote: "ไม่เกี่ยวข้อง สาบานตนแล้ว",
      province: "กรุงเทพมหานคร",
    }),
  );
  const [pages, setPages] = useState<StatementPage[]>(() => createDefaultStatementPages());
  const [pageIndex, setPageIndex] = useState(0);

  const blankHref = useMemo(() => {
    if (meta.blankFormId) return `/dashboard/smart-police/templates/${meta.blankFormId}`;
    return null;
  }, [meta.blankFormId]);

  function patchHeader<K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) {
    setHeader((h) => ({ ...h, [key]: value }));
  }

  function updatePageText(pageIdx: number, text: string) {
    setPages((ps) => ps.map((p, i) => (i === pageIdx ? { ...p, text, qa: [] } : p)));
  }

  function addContinuationSheet() {
    setPages((ps) => {
      const next = appendContinuationSheetPair(ps);
      setPageIndex(ps.length);
      return next;
    });
  }

  function removeContinuation() {
    if (pageIndex < 2) return;
    setPages((ps) => {
      const next = removeStatementPageAt(ps, pageIndex);
      if (!next) return ps;
      setPageIndex((i) => Math.max(0, Math.min(i, next.length - 1)));
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#6b7280] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-600/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">ดูแม่แบบ · {meta.title}</p>
          <p className="truncate text-xs text-slate-400">
            พิมพ์ทดลองบนฟอร์มได้เลย (ยังไม่บันทึกเข้าคดี) · กลับรายการแล้วค่อยใช้ในคดีจริง
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/smart-police/templates" className={toolbarBtnClass}>
            ← กลับรายการแม่แบบ
          </Link>
          {blankHref ? (
            <Link href={blankHref} className={toolbarBtnClass}>
              ไฟล์ต้นฉบับในคลัง
            </Link>
          ) : null}
          <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "min-h-[40px]")}>
            ไปใช้ในคดี
          </Link>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-600/60 bg-slate-900/40 px-3 py-2 sm:px-5">
        <span className="text-[11px] font-semibold text-slate-400">ชุดหน้า</span>
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={cn(
              "min-h-8 rounded-lg px-2.5 text-[11px] font-bold sm:text-xs",
              i === pageIndex ? "bg-white text-[#4d47b6]" : "bg-slate-700 text-slate-200",
            )}
            onClick={() => setPageIndex(i)}
            title={statementPageTabLabel(i)}
          >
            {statementPageTabLabel(i)}
          </button>
        ))}
        <button
          type="button"
          className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700 text-white")}
          onClick={addContinuationSheet}
        >
          + ใบต่อคำให้การ (หน้า+หลัง)
        </button>
        {pageIndex >= 2 ? (
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-rose-400/70 bg-rose-950/80 text-rose-50")}
            onClick={removeContinuation}
          >
            ลบใบต่อนี้
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialStatementFormSheet
          header={header}
          pages={pages}
          pageIndex={pageIndex}
          onHeaderChange={patchHeader}
          onPageTextChange={updatePageText}
          className="mb-8"
        />
      </div>
    </div>
  );
}
