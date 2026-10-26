"use client";

import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  createDefaultStatementPages,
  flowStatementOverflow,
  getStatementTemplateMeta,
  normalizeStatementHeader,
  removeStatementPageAt,
  statementFormTitleForSlug,
  statementPageTabLabel,
  statementPartyRoleLabelForSlug,
  type StatementHeaderFields,
  type StatementPage,
  type StatementTemplateSlug,
} from "@/lib/smart-police/form-templates";
import { OfficialStatementFormDocument } from "@/systems/smart-police/components/OfficialStatementFormSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

/**
 * ดู/ทดลองพิมพ์บนแม่แบบคำให้การ — จากหน้า /templates
 * พิมพ์ล้นหน้าแล้วไหลไปหน้าถัดไป / ต่อใบต่อให้อัตโนมัติ
 */
export function SmartPoliceStatementTemplatePreviewClient({
  slug,
  caseId,
}: {
  slug: StatementTemplateSlug;
  caseId?: string;
}) {
  const meta = getStatementTemplateMeta(slug);
  const [header, setHeader] = useState<StatementHeaderFields>(() =>
    normalizeStatementHeader({
      partyRoleLabel: statementPartyRoleLabelForSlug(slug),
      relationshipNote: slug === "statement-suspect" ? "" : "ไม่เกี่ยวข้อง สาบานตนแล้ว",
    }),
  );
  const [pages, setPages] = useState<StatementPage[]>(() => createDefaultStatementPages());
  const [pageIndex, setPageIndex] = useState(0);
  const [scrollRequest, setScrollRequest] = useState<{ page: number; nonce: number } | null>(null);

  function patchHeader<K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) {
    setHeader((h) => ({ ...h, [key]: value }));
  }

  function updatePageText(pageIdx: number, text: string) {
    setPages((ps) => ps.map((p, i) => (i === pageIdx ? { ...p, text, qa: [] } : p)));
  }

  function flowOverflow(pageIdx: number, text: string) {
    setPages((ps) => flowStatementOverflow(ps, pageIdx, text));
    setPageIndex(pageIdx + 1);
  }

  function goToPage(i: number) {
    setPageIndex(i);
    setScrollRequest((r) => ({ page: i, nonce: (r?.nonce ?? 0) + 1 }));
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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={meta.title}>
          {meta.title}
        </p>
        <nav className="flex min-w-0 flex-wrap items-center gap-1" aria-label="หน้าเอกสาร">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "h-8 min-w-8 shrink-0 rounded-md px-1.5 text-xs font-bold tabular-nums",
                i === pageIndex ? "bg-white text-[#4d47b6]" : "bg-slate-700 text-slate-200 hover:bg-slate-600",
              )}
              aria-current={i === pageIndex ? "page" : undefined}
              aria-label={`หน้า ${i + 1} · ${statementPageTabLabel(i)}`}
              title={statementPageTabLabel(i)}
              onClick={() => goToPage(i)}
            >
              {i + 1}
            </button>
          ))}
          {pageIndex >= 2 ? (
            <button
              type="button"
              className="h-8 shrink-0 rounded-md border border-rose-400/70 bg-rose-950/80 px-2 text-[11px] font-semibold text-rose-50 hover:bg-rose-900"
              onClick={removeContinuation}
            >
              ลบใบต่อนี้
            </button>
          ) : null}
        </nav>
        <SmartPoliceCaseFillBar
          caseId={caseId}
          fields={header as unknown as Record<string, unknown>}
          onFilled={(next) =>
            setHeader((h) => ({ ...h, ...(next as unknown as Partial<StatementHeaderFields>) }))
          }
        />
        <Link
          href="/dashboard/smart-police/cases"
          className={cn(smartPolicePrimaryButtonClass, "ml-auto")}
        >
          ไปใช้ในคดี
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialStatementFormDocument
          header={header}
          pages={pages}
          formTitle={statementFormTitleForSlug(slug)}
          templateSlug={slug}
          onHeaderChange={patchHeader}
          onPageTextChange={updatePageText}
          onPageOverflow={flowOverflow}
          onActivePageChange={setPageIndex}
          scrollRequest={scrollRequest}
        />
      </div>
    </div>
  );
}
