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
  createEmptySceneMapFields,
  type SceneMapFields,
} from "@/lib/smart-police/form-templates/scene-map";
import { OfficialSceneMapDocument } from "@/systems/smart-police/components/OfficialSceneMapSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

export function SmartPoliceSceneMapPreviewClient() {
  const [fields, setFields] = useState<SceneMapFields>(() => createEmptySceneMapFields());
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const camera = useAppCameraCapture({ title: "ถ่ายรูปแผนที่สังเขป" });

  function patch<K extends keyof SceneMapFields>(key: K, value: SceneMapFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function applyMapFile(file: File | undefined) {
    if (!file) return;
    const url = await prepareImageFileAsDataUrl(file);
    patch("mapImageUrl", url);
  }

  async function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    await applyMapFile(file);
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
        <button
          type="button"
          className={barBtnClass}
          onClick={() => galleryInputRef.current?.click()}
        >
          แทรกรูปแผนที่
        </button>
        <button
          type="button"
          className={barBtnClass}
          onClick={() => camera.openCamera((file) => void applyMapFile(file))}
        >
          ถ่ายรูปแผนที่
        </button>
        {fields.mapImageUrl ? (
          <button type="button" className={barBtnClass} onClick={() => patch("mapImageUrl", "")}>
            ลบรูป
          </button>
        ) : null}
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
          onPickMap={() => galleryInputRef.current?.click()}
        />
      </div>
    </div>
  );
}
