"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ARREST_WARRANT_TEMPLATE_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  createEmptyArrestWarrantFields,
  type ArrestWarrantFields,
} from "@/lib/smart-police/form-templates/arrest-warrant";
import {
  clearSheetLayout,
  emptySheetLayout,
  fetchSheetLayoutRemote,
  loadSheetLayout,
  pushSheetLayoutRemote,
  saveSheetLayout,
  type SheetLayout,
} from "@/lib/smart-police/form-templates/sheet-layout";
import { OfficialArrestWarrantDocument } from "@/systems/smart-police/components/OfficialArrestWarrantSheet";
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

const SLUG = "arrest-warrant";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600";

function round2(n: number): number {
  return Math.round(n * 10) / 10;
}

let lineSeq = 0;
function newLineId(): string {
  lineSeq += 1;
  return `ln-${Date.now().toString(36)}-${lineSeq}`;
}

export function SmartPoliceArrestWarrantPreviewClient() {
  const [fields, setFields] = useState<ArrestWarrantFields>(() => createEmptyArrestWarrantFields());
  const [layout, setLayout] = useState<SheetLayout>(() => emptySheetLayout());
  const [edit, setEdit] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SheetLayout>(emptySheetLayout());
  const hydratedRef = useRef(false);
  const pushTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    // 1) แสดงค่าที่เคยปรับไว้ในเครื่องทันทีก่อน
    const local = loadSheetLayout(SLUG);
    setLayout(local);
    layoutRef.current = local;
    // 2) แล้วโหลดฉบับถาวรจากเซิร์ฟเวอร์มาทับ (ถ้ามี)
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

  // บันทึกทุกครั้งที่ผู้ใช้ปรับ (localStorage ทันที + เซิร์ฟเวอร์แบบหน่วงสั้น ๆ)
  useEffect(() => {
    layoutRef.current = layout;
    if (!hydratedRef.current) return;
    saveSheetLayout(SLUG, layout);
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      void pushSheetLayoutRemote(SLUG, layout);
    }, 350);
  }, [layout]);

  function patch<K extends keyof ArrestWarrantFields>(key: K, value: ArrestWarrantFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
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
        setLayout((prev) => ({ ...prev, offsets: { ...prev.offsets, [key]: { ...base, dx, dy } } }));
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
        setLayout((prev) => ({ ...prev, offsets: { ...prev.offsets, [key]: { ...base, dw } } }));
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
      const cur = layoutRef.current;
      const legacy = key.includes("@") ? key.split("@")[0] : null;
      const isHidden = cur.hidden.includes(key) || (legacy ? cur.hidden.includes(legacy) : false);
      const cleaned = cur.hidden.filter((k) => k !== key && (!legacy || k !== legacy));
      const hidden = isHidden ? cleaned : [...cleaned, key];
      const next: SheetLayout = { ...cur, hidden };
      layoutRef.current = next;
      setLayout(next);
      saveSheetLayout(SLUG, next);
      flash(isHidden ? "คืนเส้นแล้ว" : "ลบเส้นแล้ว");
    },
    [flash],
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
        setLayout((prev) => ({ ...prev, lines: prev.lines.map((l) => (l.id === id ? { ...l, x, y } : l)) }));
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
        setLayout((prev) => ({ ...prev, lines: prev.lines.map((l) => (l.id === id ? { ...l, w } : l)) }));
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

  const onDeleteExtra = useCallback(
    (id: string) => {
      const next: SheetLayout = { ...layoutRef.current, lines: layoutRef.current.lines.filter((l) => l.id !== id) };
      layoutRef.current = next;
      setLayout(next);
      saveSheetLayout(SLUG, next);
      flash("ลบเส้นที่เพิ่มไว้แล้ว");
    },
    [flash],
  );

  function addLine() {
    const page = 0;
    const samePage = layoutRef.current.lines.filter((l) => l.page === page);
    const nextY = samePage.length > 0 ? round2(Math.max(...samePage.map((l) => l.y)) + 7.76) : 250;
    const id = newLineId();
    const next: SheetLayout = {
      ...layoutRef.current,
      lines: [...layoutRef.current.lines, { id, page, x: 24.5, y: nextY, w: 168.88 }],
    };
    layoutRef.current = next;
    setLayout(next);
    saveSheetLayout(SLUG, next);
    flash("เพิ่มเส้นแล้ว");
  }

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
        <p className="mr-1 min-w-0 truncate text-xs font-bold sm:text-sm" title={ARREST_WARRANT_TEMPLATE_TITLE}>
          {ARREST_WARRANT_TEMPLATE_TITLE}
        </p>
        <button
          type="button"
          onClick={() => setEdit((v) => !v)}
          className={cn(barBtnClass, edit ? "border-emerald-500 bg-emerald-600 hover:bg-emerald-500" : "")}
          title="เปิด/ปิดโหมดจัดหน้า (ลากย้าย · ดับเบิลคลิกแก้ข้อความ)"
        >
          {edit ? "เสร็จสิ้น" : "จัดหน้า"}
        </button>
        <button type="button" onClick={addLine} className={barBtnClass} title="เพิ่มเส้นจุดไข่ปลา">
          ＋เส้น
        </button>
        <button type="button" onClick={resetLayout} className={barBtnClass} title="คืนค่าเริ่มต้น">
          รีเซ็ต
        </button>
        {hint ? <span className="text-[11px] text-emerald-300">{hint}</span> : null}
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
            cursor: move;
          }
          .sp-sheet-edit .sp-a4-sheet [data-layout-key]:hover {
            background: rgba(37,99,235,0.10);
          }
        `}</style>
        <OfficialArrestWarrantDocument
          fields={fields}
          onChange={patch}
          layout={layout}
          edit={edit}
          onDragStart={onDragStart}
          onResizeStart={onResizeStart}
          onTextChange={onTextChange}
          onToggleHidden={onToggleHidden}
          onLineDrag={onLineDrag}
          onLineResize={onLineResize}
          onDeleteExtra={onDeleteExtra}
        />
      </div>
    </div>
  );
}
