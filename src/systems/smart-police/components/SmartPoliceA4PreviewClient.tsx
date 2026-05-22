"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import type { SmartPoliceA4PreviewModel } from "@/lib/smart-police/document-a4-preview";
import { cn } from "@/lib/cn";
import { IconSpPrint } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  SmartPoliceGenericA4Sheet,
  SmartPoliceStatementA4Sheet,
} from "@/systems/smart-police/components/SmartPoliceStatementA4Sheet";

export function SmartPoliceA4PreviewClient({
  caseId,
  documentId,
  initialModel,
  initialPrintHtml,
}: {
  caseId: string;
  documentId: string;
  initialModel: SmartPoliceA4PreviewModel;
  initialPrintHtml: string;
}) {
  const [model] = useState(initialModel);
  const [printHtml] = useState(initialPrintHtml);
  const [printBusy, setPrintBusy] = useState(false);

  const handlePrint = useCallback(async () => {
    setPrintBusy(true);
    try {
      const res = await fetch(
        `/api/smart-police/cases/${caseId}/documents/${documentId}/print`,
        { method: "POST" },
      );
      if (res.ok) {
        const { html } = (await res.json()) as { html: string };
        openPrintableHtml(html);
      } else {
        openPrintableHtml(printHtml);
      }
    } catch {
      openPrintableHtml(printHtml);
    } finally {
      setPrintBusy(false);
    }
  }, [caseId, documentId, printHtml]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const backHref = `/dashboard/smart-police/cases/${caseId}`;
  const Sheet = model.isStatementForm ? SmartPoliceStatementA4Sheet : SmartPoliceGenericA4Sheet;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-800 text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700/80 text-slate-200"
            aria-hidden
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6M9 16h6M7 4h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold sm:text-base">ตัวอย่างก่อนพิมพ์</p>
            <p className="truncate text-xs text-slate-400">{model.documentTitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-600 bg-slate-700/60 px-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
          >
            <span aria-hidden className="mr-1">
              ✕
            </span>
            ปิด
          </Link>
          <button
            type="button"
            disabled={printBusy}
            onClick={() => void handlePrint()}
            className={cn(
              shopQrTemplateGridPrimaryButtonClass,
              "inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-semibold",
            )}
          >
            <IconSpPrint className="h-4 w-4" aria-hidden />
            {printBusy ? "กำลังเตรียม…" : "พิมพ์ / บันทึก PDF"}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-600/90 p-3 sm:p-6">
        <Sheet model={model} printRootId="smart-police-a4-sheet" className="mb-6" />
        {model.wordFileUrl ? (
          <p className="no-print mx-auto mb-4 max-w-[210mm] text-center text-xs text-slate-200">
            มีไฟล์ Word แนบ —{" "}
            <a
              href={model.wordFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-300 underline"
            >
              เปิด {model.wordFileName ?? ".docx"}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
