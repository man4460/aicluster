"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import {
  AppGalleryCameraFileInputs,
  prepareImageFileAsDataUrl,
  useAppCameraCapture,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { SCENE_MAP_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  createEmptySceneMapExtraPage,
  createEmptySceneMapFields,
  type SceneMapFields,
} from "@/lib/smart-police/form-templates/scene-map";
import { OfficialSceneMapDocument } from "@/systems/smart-police/components/OfficialSceneMapSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";
import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

export function SmartPoliceSceneMapPreviewClient({ caseId }: { caseId?: string } = {}) {
  const [fields, setFields] = useState<SceneMapFields>(() => createEmptySceneMapFields());
  const [pageIndex, setPageIndex] = useState(0);
  const pickPageRef = useRef(0);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const camera = useAppCameraCapture({ title: "ถ่ายรูปแผนที่สังเขป" });

  const extraPages = fields.extraPages ?? [];
  const sheetCount = 1 + extraPages.length;
  const currentMapUrl = pageIndex === 0 ? fields.mapImageUrl : extraPages[pageIndex - 1]?.mapImageUrl ?? "";

  function patch<K extends keyof SceneMapFields>(key: K, value: SceneMapFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function applyMapUrl(url: string, pageIdx: number) {
    if (pageIdx <= 0) {
      setFields((f) => ({ ...f, mapImageUrl: url }));
      return;
    }
    setFields((f) => ({
      ...f,
      extraPages: (f.extraPages ?? []).map((p, i) => (i === pageIdx - 1 ? { ...p, mapImageUrl: url } : p)),
    }));
  }

  async function applyMapFile(file: File | undefined) {
    if (!file) return;
    const url = await prepareImageFileAsDataUrl(file);
    applyMapUrl(url, pickPageRef.current);
  }

  async function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    await applyMapFile(file);
  }

  function goToPage(i: number) {
    pickPageRef.current = i;
    setPageIndex(i);
    document.querySelector(`[data-sheet-index="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openPick(pageIdx: number) {
    pickPageRef.current = pageIdx;
    setPageIndex(pageIdx);
    galleryInputRef.current?.click();
  }

  function addExtraPage() {
    const nextIndex = extraPages.length + 1;
    setFields((f) => ({
      ...f,
      extraPages: [...(f.extraPages ?? []), createEmptySceneMapExtraPage()],
    }));
    pickPageRef.current = nextIndex;
    setPageIndex(nextIndex);
    window.setTimeout(() => {
      document
        .querySelector(`[data-sheet-index="${nextIndex}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function removeLastExtraPage() {
    if (extraPages.length === 0) return;
    setFields((f) => ({
      ...f,
      extraPages: (f.extraPages ?? []).slice(0, -1),
    }));
    const lastIndex = extraPages.length - 1;
    pickPageRef.current = Math.min(pickPageRef.current, lastIndex);
    setPageIndex((i) => Math.min(i, lastIndex));
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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={SCENE_MAP_FORM_TITLE}>
          {SCENE_MAP_FORM_TITLE}
        </p>
        <nav className="flex min-w-0 flex-wrap items-center gap-1" aria-label="หน้าเอกสาร">
          {Array.from({ length: sheetCount }, (_, i) => (
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
        <button type="button" className={barBtnClass} onClick={addExtraPage}>
          + เพิ่มหน้าแผนที่
        </button>
        {extraPages.length > 0 ? (
          <button type="button" className={barBtnClass} onClick={removeLastExtraPage} aria-label="ลบหน้าแผนที่สุดท้าย">
            ลบหน้าสุดท้าย
          </button>
        ) : null}
        <button type="button" className={barBtnClass} onClick={() => openPick(pageIndex)}>
          แทรกรูปแผนที่
        </button>
        <button
          type="button"
          className={barBtnClass}
          onClick={() => {
            pickPageRef.current = pageIndex;
            camera.openCamera((file) => void applyMapFile(file));
          }}
        >
          ถ่ายรูปแผนที่
        </button>
        {currentMapUrl ? (
          <button type="button" className={barBtnClass} onClick={() => applyMapUrl("", pageIndex)}>
            ลบรูป
          </button>
        ) : null}
        <SmartPoliceCaseFillBar
          caseId={caseId}
          fields={fields}
          onFilled={setFields}
        />
        <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "ml-auto")}>
          ไปใช้ในคดี
        </Link>
      </header>

      <AppGalleryCameraFileInputs
        galleryInputRef={galleryInputRef}
        cameraInputRef={camera.cameraInputRef}
        onChange={(e) => void onFileInput(e)}
      />
      {camera.cameraModal}

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialSceneMapDocument
          fields={fields}
          onChange={patch}
          onPickMap={openPick}
        />
      </div>
    </div>
  );
}
