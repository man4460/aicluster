"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { SUSPECT_SUMMONS_TEMPLATE_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  createEmptySuspectSummonsFields,
  type SuspectSummonsFields,
} from "@/lib/smart-police/form-templates/suspect-summons";
import {
  clearSheetLayout,
  emptySheetLayout,
  fetchSheetLayoutRemote,
  loadSheetLayout,
  pushSheetLayoutRemote,
  saveSheetLayout,
  type SheetLayout,
} from "@/lib/smart-police/form-templates/sheet-layout";
import { OfficialSuspectSummonsDocument } from "@/systems/smart-police/components/OfficialSuspectSummonsSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";
import { SmartPoliceCaseFillBar } from "@/systems/smart-police/components/SmartPoliceCaseFillBar";

const SLUG = "suspect-summons";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

function round2(n: number): number {
  return Math.round(n * 10) / 10;
}

export function SmartPoliceSuspectSummonsPreviewClient({ caseId }: { caseId?: string } = {}) {
  const [fields, setFields] = useState<SuspectSummonsFields>(() => createEmptySuspectSummonsFields());
  const [layout, setLayout] = useState<SheetLayout>(() => emptySheetLayout());
  const [edit, setEdit] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SheetLayout>(emptySheetLayout());
  const hydratedRef = useRef(false);
  const pushTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    const local = loadSheetLayout(SLUG);
    setLayout(local);
    layoutRef.current = local;
    void (async () => {
      const remote = await fetchSheetLayoutRemote(SLUG);
      if (!alive) return;
      if (remote) {
        setLayout(remote);
        layoutRef.current = remote;
        saveSheetLayout(SLUG, remote);
      }
      hydratedRef.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    layoutRef.current = layout;
    if (!hydratedRef.current) return;
    saveSheetLayout(SLUG, layout);
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      void pushSheetLayoutRemote(SLUG, layout);
    }, 350);
  }, [layout]);

  function patch<K extends keyof SuspectSummonsFields>(key: K, value: SuspectSummonsFields[K]) {
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

  const pxPerMm = useCallback(() => {
    const sheet = stageRef.current?.querySelector<HTMLElement>(".sp-a4-sheet");
    const w = sheet?.getBoundingClientRect().width ?? 0;
    return w > 0 ? w / 210 : 3.8;
  }, []);

  const flash = useCallback((msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(null), 1200);
  }, []);

  const onDragStart = useCallback(
    (key: string, e: React.PointerEvent) => {
      e.preventDefault();
      const ppm = pxPerMm();
      const base = layoutRef.current.offsets[key] ?? { dx: 0, dy: 0 };
      const startX = e.clientX;
      const startY = e.clientY;
      function move(ev: PointerEvent) {
        const dx = round2(base.dx + (ev.clientX - startX) / ppm);
        const dy = round2(base.dy + (ev.clientY - startY) / ppm);
        setLayout((prev) => ({ ...prev, offsets: { ...prev.offsets, [key]: { dx, dy } } }));
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        saveSheetLayout(SLUG, layoutRef.current);
        flash("บันทึกตำแหน่งแล้ว");
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [pxPerMm, flash],
  );

  const onResizeStart = useCallback(
    (key: string, e: React.PointerEvent) => {
      e.preventDefault();
      const ppm = pxPerMm();
      const base = layoutRef.current.offsets[key] ?? { dx: 0, dy: 0 };
      const startX = e.clientX;
      function move(ev: PointerEvent) {
        const dw = round2((base.dw ?? 0) + (ev.clientX - startX) / ppm);
        setLayout((prev) => ({
          ...prev,
          offsets: { ...prev.offsets, [key]: { ...base, dw } },
        }));
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        saveSheetLayout(SLUG, layoutRef.current);
        flash("ปรับความยาวเส้นแล้ว");
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [pxPerMm, flash],
  );

  const onLineResize = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.preventDefault();
      const ppm = pxPerMm();
      const line = layoutRef.current.lines.find((l) => l.id === id);
      if (!line) return;
      const baseW = line.w;
      const startX = e.clientX;
      function move(ev: PointerEvent) {
        const w = round2(Math.max(5, baseW + (ev.clientX - startX) / ppm));
        setLayout((prev) => ({
          ...prev,
          lines: prev.lines.map((l) => (l.id === id ? { ...l, w } : l)),
        }));
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        saveSheetLayout(SLUG, layoutRef.current);
        flash("ปรับความยาวเส้นแล้ว");
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [pxPerMm, flash],
  );

  const onLineDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.preventDefault();
      const ppm = pxPerMm();
      const line = layoutRef.current.lines.find((l) => l.id === id);
      if (!line) return;
      const base = { x: line.x, y: line.y };
      const startX = e.clientX;
      const startY = e.clientY;
      function move(ev: PointerEvent) {
        const x = round2(base.x + (ev.clientX - startX) / ppm);
        const y = round2(base.y + (ev.clientY - startY) / ppm);
        setLayout((prev) => ({
          ...prev,
          lines: prev.lines.map((l) => (l.id === id ? { ...l, x, y } : l)),
        }));
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        saveSheetLayout(SLUG, layoutRef.current);
        flash("บันทึกเส้นแล้ว");
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [pxPerMm, flash],
  );

  const onTextChange = useCallback(
    (key: string, text: string) => {
      const next: SheetLayout = { ...layoutRef.current, texts: { ...layoutRef.current.texts, [key]: text } };
      setLayout(next);
      saveSheetLayout(SLUG, next);
      flash("แก้ข้อความแล้ว");
    },
    [flash],
  );

  const onToggleHidden = useCallback(
    (key: string) => {
      const isHidden = layoutRef.current.hidden.includes(key);
      const next: SheetLayout = {
        ...layoutRef.current,
        hidden: isHidden
          ? layoutRef.current.hidden.filter((k) => k !== key)
          : [...layoutRef.current.hidden, key],
      };
      layoutRef.current = next;
      setLayout(next);
      saveSheetLayout(SLUG, next);
      flash(isHidden ? "คืนเส้นแล้ว" : "ลบเส้นแล้ว");
    },
    [flash],
  );

  function resetLayout() {
    clearSheetLayout(SLUG);
    const empty = emptySheetLayout();
    layoutRef.current = empty;
    setLayout(empty);
    flash("รีเซ็ตเป็นค่าเริ่มต้นแล้ว");
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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={SUSPECT_SUMMONS_TEMPLATE_TITLE}>
          {SUSPECT_SUMMONS_TEMPLATE_TITLE}
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
        <button
          type="button"
          onClick={() => setEdit((v) => !v)}
          className={cn(barBtnClass, edit ? "border-emerald-500 bg-emerald-600 hover:bg-emerald-500" : "")}
          title="เปิด/ปิดโหมดจัดหน้า (ลากเพื่อย้าย · ดับเบิลคลิกเพื่อแก้ข้อความ)"
        >
          {edit ? "เสร็จสิ้น" : "จัดหน้า"}
        </button>
        <button type="button" onClick={resetLayout} className={barBtnClass} title="คืนค่าเริ่มต้น">
          รีเซ็ต
        </button>
        {hint ? <span className="text-[11px] text-emerald-300">{hint}</span> : null}
        <SmartPoliceCaseFillBar
          caseId={caseId}
          fields={fields}
          onFilled={setFields}
        />
        <Link href="/dashboard/smart-police/cases" className={cn(smartPolicePrimaryButtonClass, "ml-auto")}>
          ไปใช้ในคดี
        </Link>
      </header>

      <div
        ref={stageRef}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6",
          edit ? "sp-sheet-edit" : "",
        )}
      >
        <style>{`
          .sp-sheet-edit .sp-a4-sheet [data-layout-key] {
            outline: 1px dashed rgba(37,99,235,0.65);
            outline-offset: 1px;
            border-radius: 1px;
          }
          .sp-sheet-edit .sp-a4-sheet [data-layout-key]:hover {
            background: rgba(37,99,235,0.10);
          }
          .sp-sheet-edit .sp-a4-sheet [data-layout-key] {
            cursor: move;
          }
        `}</style>
        <OfficialSuspectSummonsDocument
          fields={fields}
          onChange={patch}
          onPageCount={onPageCount}
          layout={layout}
          edit={edit}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
          onTextChange={onTextChange}
          onLineDrag={onLineDrag}
          onLineResize={onLineResize}
          onToggleHidden={onToggleHidden}
        />
      </div>
    </div>
  );
}
