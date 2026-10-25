"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { type SearchWarrantRequestFields } from "@/lib/smart-police/form-templates/search-warrant-request";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 18;
const LINE = 7.76;
const RULE_DY = 6.2;

export type SheetEditCtx = {
  layout: SheetLayout;
  edit: boolean;
  onDragStart?: (key: string, e: React.PointerEvent) => void;
  onResizeStart?: (key: string, e: React.PointerEvent) => void;
  onTextChange?: (key: string, text: string) => void;
  onLineDrag?: (id: string, e: React.PointerEvent) => void;
  onLineResize?: (id: string, e: React.PointerEvent) => void;
  onToggleHidden?: (key: string) => void;
  onDeleteExtra?: (id: string) => void;
};
export const SheetCtx = createContext<SheetEditCtx>({ layout: emptySheetLayout(), edit: false });

function topFor(y: number, size: number): number {
  return y + 0.1227 * size - 1.267;
}

const PROSE: CSSProperties = {
  position: "absolute",
  lineHeight: `${LINE}mm`,
};

export function Lbl({
  x,
  y,
  children,
  size = BODY,
  bold = false,
  nowrap = true,
  k,
  w,
}: {
  x?: number;
  y: number;
  children: ReactNode;
  size?: number;
  bold?: boolean;
  nowrap?: boolean;
  k?: string;
  w?: number;
}) {
  const { layout, edit, onDragStart, onTextChange } = useContext(SheetCtx);
  // unique per instance: same position can hold different labels on different pages
  const lblText = typeof children === "string" ? children : "";
  const key = k ?? `lbl:${x ?? 0}:${y}:${lblText}`;
  const legacyKey = k ? null : `lbl:${x ?? 0}:${y}`;
  const o = layout.offsets[key] ?? (legacyKey ? layout.offsets[legacyKey] : undefined);
  const dx = o?.dx ?? 0;
  const dy = o?.dy ?? 0;
  const override = layout.texts[key] ?? (legacyKey ? layout.texts[legacyKey] : undefined);
  return (
    <span
      data-layout-key={key}
      onPointerDown={edit && onDragStart ? (e) => onDragStart(key, e) : undefined}
      onDoubleClick={
        edit && onTextChange
          ? (e) => {
              e.stopPropagation();
              const current = override ?? (typeof children === "string" ? children : "");
              const next = window.prompt("แก้ไขข้อความ", current);
              if (next != null) onTextChange(key, next);
            }
          : undefined
      }
      style={{
        ...PROSE,
        top: `${topFor(y + dy, size).toFixed(2)}mm`,
        left: `${((x ?? 0) + dx).toFixed(2)}mm`,
        fontSize: `${size}pt`,
        fontWeight: bold ? 700 : 400,
        whiteSpace: nowrap ? "nowrap" : "normal",
        ...(w ? { width: `${w}mm` } : {}),
        cursor: edit ? "move" : undefined,
      }}
    >
      {override ?? children}
    </span>
  );
}

export function Line({
  label,
  labelX,
  x0,
  x1,
  y,
  value,
  onChange,
  aria,
}: {
  label?: string;
  labelX?: number;
  x0: number;
  x1: number;
  y: number;
  value: string;
  onChange: (v: string) => void;
  aria: string;
}) {
  const { layout, edit, onDragStart, onResizeStart, onToggleHidden } = useContext(SheetCtx);
  // unique per instance: same aria can appear on many rows — key by position too
  const key = `line:${aria}@${y}:${x0}`;
  // อ่านค่าที่เคยบันทึกด้วยคีย์แบบเก่า (line:<aria>) ด้วย เพื่อไม่ให้งานที่จัดไว้หาย
  const legacyKey = `line:${aria}`;
  const o = layout.offsets[key] ?? layout.offsets[legacyKey];
  const dx = o?.dx ?? 0;
  const dy = o?.dy ?? 0;
  const dw = o?.dw ?? 0;
  const hidden = layout.hidden.includes(key) || layout.hidden.includes(legacyKey);
  if (hidden && !edit) {
    return label ? (
      <Lbl x={labelX ?? x0} y={y} k={key}>
        {label}
      </Lbl>
    ) : null;
  }
  return (
    <>
      {label ? (
        <Lbl x={labelX ?? x0} y={y} k={key}>
          {label}
        </Lbl>
      ) : null}
      <span
        className="sp-rule-cell"
        data-layout-key={key}
        onPointerDown={edit && onDragStart ? (e) => onDragStart(key, e) : undefined}
        style={{
          position: "absolute",
          left: `${(x0 + dx).toFixed(2)}mm`,
          top: `${(y + dy + 0.7).toFixed(2)}mm`,
          width: `${Math.max(2, x1 - x0 + dw).toFixed(2)}mm`,
          height: `${RULE_DY.toFixed(2)}mm`,
          borderBottom: "0.5pt dotted #111",
          boxSizing: "border-box",
          cursor: edit ? "move" : undefined,
        }}
      >
        <input
          aria-label={aria}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="sp-bare-field"
          style={{
            display: "block",
            width: "100%",
            minWidth: 0,
            height: `${LINE.toFixed(2)}mm`,
            marginTop: `${(RULE_DY - LINE).toFixed(2)}mm`,
            fontFamily: FONT,
            fontSize: `${BODY}pt`,
            lineHeight: `${LINE.toFixed(2)}mm`,
            boxSizing: "border-box",
            padding: 0,
            textAlign: "left",
            textIndent: "4mm",
          }}
        />
        {edit && onResizeStart ? (
          <span
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(key, e);
            }}
            style={{
              position: "absolute",
              right: "-1.2mm",
              top: "-1mm",
              width: "2.4mm",
              height: `${(RULE_DY + 2).toFixed(2)}mm`,
              background: "rgba(37,99,235,0.55)",
              border: "0.5pt solid #1d4ed8",
              cursor: "ew-resize",
            }}
          />
        ) : null}
        {edit && onToggleHidden ? (
          <span
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleHidden(key);
            }}
            style={{
              position: "absolute",
              right: "-1.2mm",
              top: "-4.2mm",
              width: "2.6mm",
              height: "2.6mm",
              background: hidden ? "#16a34a" : "#dc2626",
              color: "#fff",
              fontSize: "7pt",
              lineHeight: "2.6mm",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {hidden ? "↺" : "×"}
          </span>
        ) : null}
      </span>
    </>
  );
}

export function Sheet({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: `${PAGE_W}mm`,
        height: `${PAGE_H}mm`,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        fontFamily: FONT,
        fontSize: `${BODY}pt`,
        lineHeight: `${LINE}mm`,
        color: "#111",
      }}
    >
      {children}
    </article>
  );
}

export function CheckBox({
  x,
  y,
  checked,
  onToggle,
  label,
  width,
  flow,
}: {
  x: number;
  y: number;
  checked: boolean;
  onToggle: () => void;
  label: string;
  width?: number;
  flow?: boolean;
}) {
  const { layout, edit, onDragStart } = useContext(SheetCtx);
  // unique per instance: same label can appear more than once
  const key = `chk:${label}@${y}:${x}`;
  const legacyKey = `chk:${label}`;
  const o = layout.offsets[key] ?? layout.offsets[legacyKey];
  const dx = o?.dx ?? 0;
  const dy = o?.dy ?? 0;
  return (
    <button
      type="button"
      aria-pressed={checked}
      data-layout-key={key}
      onPointerDown={edit && onDragStart ? (e) => onDragStart(key, e) : undefined}
      onClick={edit ? undefined : onToggle}
      style={{
        position: flow ? "relative" : "absolute",
        left: flow ? undefined : `${(x + dx).toFixed(2)}mm`,
        top: flow ? undefined : `${(y + dy - 1.0).toFixed(2)}mm`,
        display: "flex",
        alignItems: "flex-start",
        gap: "2.2mm",
        padding: 0,
        border: "none",
        background: "transparent",
        font: "inherit",
        fontSize: `${BODY}pt`,
        lineHeight: `${LINE}mm`,
        color: "#111",
        cursor: edit ? "move" : "pointer",
        textAlign: "left",
        ...(width ? { width: `${width}mm` } : {}),
      }}
    >
      <span
        aria-hidden
        style={{
          width: "4.2mm",
          height: "4.2mm",
          marginTop: "1.1mm",
          flexShrink: 0,
          border: "0.5pt solid #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10pt",
          lineHeight: 1,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ExtraLines({ page }: { page: number }) {
  const { layout, edit, onLineDrag, onLineResize, onDeleteExtra } = useContext(SheetCtx);
  return (
    <>
      {layout.lines
        .filter((ln) => ln.page === page)
        .map((ln) => (
          <div
            key={ln.id}
            aria-hidden
            data-layout-key={`extra:${ln.id}`}
            onPointerDown={edit && onLineDrag ? (e) => onLineDrag(ln.id, e) : undefined}
            style={{
              position: "absolute",
              left: `${ln.x}mm`,
              width: `${ln.w}mm`,
              top: `${ln.y}mm`,
              height: edit ? "2.4mm" : undefined,
              borderTop: "0.5pt dotted #111",
              cursor: edit ? "move" : undefined,
            }}
          >
            {edit && onLineResize ? (
              <span
                aria-hidden
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onLineResize(ln.id, e);
                }}
                style={{
                  position: "absolute",
                  right: "-1.2mm",
                  top: "-1mm",
                  width: "2.4mm",
                  height: "2.4mm",
                  background: "rgba(37,99,235,0.55)",
                  border: "0.5pt solid #1d4ed8",
                  cursor: "ew-resize",
                }}
              />
            ) : null}
            {edit && onDeleteExtra ? (
              <span
                aria-hidden
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onDeleteExtra(ln.id);
                }}
                style={{
                  position: "absolute",
                  right: "-1.2mm",
                  top: "-4.2mm",
                  width: "2.6mm",
                  height: "2.6mm",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "7pt",
                  lineHeight: "2.6mm",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                ×
              </span>
            ) : null}
          </div>
        ))}
    </>
  );
}

export function AutoLinedField({
  k,
  aria,
  value,
  onChange,
  left,
  top,
  width,
  minLines,
  indent,
  firstLeft,
  firstWidth,
  restLeft,
  restWidth,
}: {
  k: string;
  aria: string;
  value: string;
  onChange: (v: string) => void;
  left: number;
  top: number;
  width: number;
  minLines: number;
  indent?: number;
  firstLeft: number;
  firstWidth: number;
  restLeft: number;
  restWidth: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const { edit, layout } = useContext(SheetCtx);
  const syncFirst = layout.offsets[k];
  const syncDx = syncFirst?.dx ?? 0;
  const syncDy = syncFirst?.dy ?? 0;
  const syncDw = syncFirst?.dw ?? 0;
  const [count, setCount] = useState(minLines);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    const lh = parseFloat(window.getComputedStyle(el).lineHeight) || 0;
    if (lh > 0) {
      const n = Math.max(minLines, Math.round(el.scrollHeight / lh));
      setCount((c) => (c === n ? c : n));
    }
  }, [value, minLines]);
  const firstRuleY = top + RULE_DY;
  return (
    <>
      <textarea
        ref={ref}
        aria-label={aria}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          left: `${left + syncDx}mm`,
          width: `${width + syncDw}mm`,
          top: `${top + syncDy}mm`,
          minHeight: `${(minLines * LINE).toFixed(2)}mm`,
          boxSizing: "border-box",
          ...(indent ? { textIndent: `${indent}mm` } : {}),
          fontFamily: FONT,
          fontSize: `${BODY}pt`,
          fontWeight: 400,
          lineHeight: `${LINE}mm`,
          color: "#111",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          resize: "none",
          pointerEvents: edit ? "none" : "auto",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          overflow: "hidden",
        }}
      />
      {Array.from({ length: count }, (_, i) => (
        <Rule
          key={`${k}:${i}`}
          k={k}
          left={i === 0 ? firstLeft : restLeft}
          width={i === 0 ? firstWidth : restWidth}
          top={firstRuleY + i * LINE}
        />
      ))}
    </>
  );
}

export function Rule({ k, left, top, width }: { k: string; left: number; top: number; width: number }) {
  const { layout, edit, onDragStart, onResizeStart } = useContext(SheetCtx);
  const o = layout.offsets[k];
  const dx = o?.dx ?? 0;
  const dy = o?.dy ?? 0;
  const dw = o?.dw ?? 0;
  return (
    <div
      aria-hidden
      data-layout-key={k}
      onPointerDown={edit && onDragStart ? (e) => onDragStart(k, e) : undefined}
      style={{
        position: "absolute",
        left: `${(left + dx).toFixed(2)}mm`,
        width: `${Math.max(5, width + dw).toFixed(2)}mm`,
        top: `${(top + dy).toFixed(2)}mm`,
        height: edit ? "2.4mm" : undefined,
        borderTop: "0.5pt dotted #111",
        cursor: edit ? "move" : undefined,
      }}
    >
      {edit && onResizeStart ? (
        <span
          aria-hidden
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart(k, e);
          }}
          style={{
            position: "absolute",
            right: "-1.2mm",
            top: "-1mm",
            width: "2.4mm",
            height: "2.4mm",
            background: "rgba(37,99,235,0.55)",
            border: "0.5pt solid #1d4ed8",
            cursor: "ew-resize",
          }}
        />
      ) : null}
    </div>
  );
}

export function useLineCounter(): (text: string) => number {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, setReady] = useState(false);
  useEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "width:168.88mm",
      "visibility:hidden",
      "pointer-events:none",
      `font-family:${FONT}`,
      `font-size:${BODY}pt`,
      `line-height:${LINE}mm`,
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
    ].join(";");
    document.body.appendChild(host);
    ref.current = host;
    setReady(true);
    return () => {
      host.remove();
      ref.current = null;
    };
  }, []);
  return (text: string): number => {
    const host = ref.current;
    if (!host) return estimateArrestWrappedLines(text, 0);
    host.textContent = text;
    const lh = parseFloat(getComputedStyle(host).lineHeight) || 0;
    if (!(lh > 0)) return estimateArrestWrappedLines(text, 0);
    return Math.max(1, Math.round(host.scrollHeight / lh));
  };
}

export function OfficialSearchWarrantRequestDocument({
  fields,
  onChange,
  layout = emptySheetLayout(),
  edit = false,
  onDragStart,
  onResizeStart,
  onTextChange,
  onLineDrag,
  onLineResize,
  onToggleHidden,
  onDeleteExtra,
}: {
  fields: SearchWarrantRequestFields;
  onChange: <K extends keyof SearchWarrantRequestFields>(key: K, value: SearchWarrantRequestFields[K]) => void;
  layout?: SheetLayout;
  edit?: boolean;
  onDragStart?: (key: string, e: React.PointerEvent) => void;
  onResizeStart?: (key: string, e: React.PointerEvent) => void;
  onTextChange?: (key: string, text: string) => void;
  onLineDrag?: (id: string, e: React.PointerEvent) => void;
  onLineResize?: (id: string, e: React.PointerEvent) => void;
  onToggleHidden?: (key: string) => void;
  onDeleteExtra?: (id: string) => void;
}) {
  const countLines = useLineCounter();
  const PAGE1_LINES = 12;
  const totalNarrLines = countLines(fields.circumstances);
  const [narr1, narr2] =
    totalNarrLines > PAGE1_LINES
      ? splitArrestTextByLines(fields.circumstances, PAGE1_LINES, 0, countLines)
      : [fields.circumstances, ""];
  return (
    <SheetCtx.Provider
      value={{
        layout,
        edit,
        onDragStart,
        onResizeStart,
        onTextChange,
        onLineDrag,
        onLineResize,
        onToggleHidden,
        onDeleteExtra,
      }}
    >
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
        <ExtraLines page={0} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smart-police/garuda.png"
          alt=""
          width={96}
          height={110}
          style={{ position: "absolute", left: "88.6mm", top: "12mm", width: "26.4mm", height: "26.8mm", objectFit: "contain" }}
        />
        <Lbl x={25.7} y={26.2} size={TITLE} bold>
          คำร้อง-ขอออกหมายค้น
        </Lbl>
        <Line labelX={141.6} label="ที่" x0={146.0} x1={193.38} y={37.9} value={fields.docNo} onChange={(v) => onChange("docNo", v)} aria="ที่" />

        <Lbl x={24.5} y={50.8}>
          รับคำร้อง
        </Lbl>
        <Line labelX={102.8} label="ศาล" x0={110.0} x1={193.38} y={50.9} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Lbl x={24.5} y={58.5}>
          เรียกสอบ
        </Lbl>
        <Line labelX={95.0} label="วันที่" x0={105.0} x1={119.0} y={58.7} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={119.0} label="เดือน" x0={127.0} x1={150.0} y={58.7} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={150.0} label="พุทธศักราช" x0={170.0} x1={193.38} y={58.7} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={53.4} y={66.3}>
          ผู้พิพากษา
        </Lbl>
        <Lbl x={92.8} y={66.4} bold>
          ความอาญา
        </Lbl>

        <Lbl x={44.1} y={80.7}>
          ข้าพเจ้า
        </Lbl>
        <Line x0={53.0} x1={180.0} y={80.7} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="ข้าพเจ้า" />
        <Lbl x={183.8} y={80.7}>
          ผู้ร้อง
        </Lbl>

        <Lbl x={43.0} y={88.4}>
          ปี
        </Lbl>
        <Line x0={46.0} x1={52.9} y={88.4} value={fields.deptYear} onChange={(v) => onChange("deptYear", v)} aria="ปี" />
        <Lbl x={53.0} y={88.4}>
          อาชีพ
        </Lbl>
        <Line x0={63.0} x1={75.0} y={88.4} value={fields.occupation} onChange={(v) => onChange("occupation", v)} aria="อาชีพ" />
        <Line x0={75.5} x1={104.0} y={88.4} value={fields.dept} onChange={(v) => onChange("dept", v)} aria="รับราชการ" />
        <Lbl x={104.0} y={88.4}>
          สถานที่ทำงาน
        </Lbl>
        <Line x0={124.0} x1={140.0} y={88.4} value={fields.workplace} onChange={(v) => onChange("workplace", v)} aria="สถานที่ทำงาน" />
        <Line x0={141.0} x1={193.38} y={88.4} value={fields.station} onChange={(v) => onChange("station", v)} aria="สถานี" />

        <Lbl x={24.5} y={88.4}>
          อายุ
        </Lbl>
        <Line x0={32.0} x1={42.0} y={88.4} value={fields.age} onChange={(v) => onChange("age", v)} aria="อายุ" />

        <Lbl x={70.3} y={96.2}>
          อำเภอ/เขต
        </Lbl>
        <Line x0={86.0} x1={140.0} y={96.2} value={fields.addrDistrict} onChange={(v) => onChange("addrDistrict", v)} aria="อำเภอเขต" />
        <Lbl x={142.9} y={96.2}>
          จังหวัด
        </Lbl>
        <Line x0={155.0} x1={193.38} y={96.2} value={fields.addrProvince} onChange={(v) => onChange("addrProvince", v)} aria="จังหวัด" />

        <Lbl x={24.5} y={96.2}>
          ตำบล/แขวง
        </Lbl>
        <Line x0={41.0} x1={65.0} y={96.2} value={fields.addrSubDistrict} onChange={(v) => onChange("addrSubDistrict", v)} aria="ตำบลแขวง" />

        <Lbl x={24.5} y={104.8}>
          โทรศัพท์
        </Lbl>
        <Line x0={36.0} x1={75.0} y={104.8} value={fields.phone} onChange={(v) => onChange("phone", v)} aria="โทรศัพท์" />

        <Lbl x={24.5} y={113.5} nowrap={false}>
          ขอยื่นคำร้องขอออกหมายค้นต่อศาล ดังมีข้อความตามที่จะกล่าวดังนี้
        </Lbl>

        <Lbl x={45.4} y={121.26}>
          ข้อ ๑. ด้วยปรากฏจากการสืบสวน/สอบสวน ของ
        </Lbl>
        <Line x0={120.0} x1={193.38} y={121.26} value={fields.investigationText} onChange={(v) => onChange("investigationText", v)} aria="พนักงานสอบสวน" />
        <Line x0={24.5} x1={178.0} y={128.62} value={fields.incidentTime} onChange={(v) => onChange("incidentTime", v)} aria="รายละเอียดทราบว่า" />
        <Lbl x={180.4} y={129.02}>
          ทราบว่า
        </Lbl>

        <Lbl x={24.5} y={136.76}>
          ที่บ้านเลขที่
        </Lbl>
        <Line x0={42.0} x1={120.0} y={136.76} value={fields.searchHouseNo} onChange={(v) => onChange("searchHouseNo", v)} aria="บ้านเลขที่" />
        <Lbl x={122.8} y={136.76}>
          หมู่ที่
        </Lbl>
        <Line x0={130.0} x1={142.0} y={136.76} value={fields.searchMoo} onChange={(v) => onChange("searchMoo", v)} aria="หมู่ที่" />
        <Lbl x={142.9} y={136.76}>
          ตรอก/ซอย
        </Lbl>
        <Line x0={159.0} x1={193.38} y={136.76} value={fields.searchAlley} onChange={(v) => onChange("searchAlley", v)} aria="ตรอกซอย" />

        <Lbl x={24.5} y={144.56}>
          ตำบล/แขวง
        </Lbl>
        <Line x0={43.0} x1={82.0} y={144.56} value={fields.searchSubDistrict} onChange={(v) => onChange("searchSubDistrict", v)} aria="ตำบลแขวง" />
        <Lbl x={82.9} y={144.56}>
          อำเภอ/เขต
        </Lbl>
        <Line x0={99.5} x1={142.0} y={144.56} value={fields.searchDistrict} onChange={(v) => onChange("searchDistrict", v)} aria="อำเภอเขต" />
        <Lbl x={142.9} y={144.56}>
          จังหวัด
        </Lbl>
        <Line x0={153.0} x1={193.38} y={144.56} value={fields.searchProvince} onChange={(v) => onChange("searchProvince", v)} aria="จังหวัด" />

        <Lbl x={24.5} y={152.26}>
          มี
        </Lbl>
        <Lbl x={28.8} y={152.26}>
          นาย/นาง/นางสาว
        </Lbl>
        <Line x0={55.5} x1={160.0} y={152.26} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="ผู้ต้องหา" />
        <Lbl x={167.9} y={152.26}>
          อายุ
        </Lbl>
        <Line x0={174.0} x1={182.0} y={152.26} value={fields.suspectAge} onChange={(v) => onChange("suspectAge", v)} aria="อายุ" />
        <Lbl x={183.0} y={152.26}>
          ปี
        </Lbl>

        <Lbl x={24.5} y={160.06}>
          อาชีพ
        </Lbl>
        <Line x0={34.0} x1={80.0} y={160.06} value={fields.suspectOccupation} onChange={(v) => onChange("suspectOccupation", v)} aria="อาชีพ" />
        <Lbl x={82.9} y={160.06}>
          ตำแหน่ง
        </Lbl>
        <Line x0={95.0} x1={140.0} y={160.06} value={fields.suspectPosition} onChange={(v) => onChange("suspectPosition", v)} aria="ตำแหน่ง" />
        <Lbl x={142.9} y={160.06} nowrap={false}>
          เป็นเจ้าของบ้านหรือผู้ครอบครอง
        </Lbl>

        <Lbl x={24.5} y={167.76} nowrap={false}>
          มีพฤติการณ์ที่เป็นเหตุแห่งการออกหมายค้น คือ
        </Lbl>

        <AutoLinedField
          k="p1-narrative"
          aria="พฤติการณ์ที่เป็นเหตุแห่งการออกหมายค้น"
          value={narr1}
          onChange={(v) => onChange("circumstances", v + narr2)}
          left={24.5}
          top={176.56}
          width={168.88}
          minLines={12}
          firstLeft={24.5}
          firstWidth={168.88}
          restLeft={24.5}
          restWidth={168.88}
        />

        {narr2 ? null : (
          <Lbl x={25.7} y={271.38} nowrap={false} k="p1-detail-note">
            รายละเอียดข้อมูลและพยานหลักฐานพร้อมแผนที่สังเขป ปรากฏตามเอกสารที่แนบมาพร้อมนี้
          </Lbl>
        )}
      </Sheet>

      {narr2 ? (
        <Sheet index={1}>
          <ExtraLines page={1} />
          <Lbl x={103.0} y={17}>
            ๒
          </Lbl>
          <AutoLinedField
            k="p1-narrative-cont"
            aria="พฤติการณ์ (ต่อ)"
            value={narr2}
            onChange={(v) => onChange("circumstances", narr1 + v)}
            left={24.5}
            top={24}
            width={168.88}
            minLines={30}
            firstLeft={24.5}
            firstWidth={168.88}
            restLeft={24.5}
            restWidth={168.88}
          />
          <Lbl x={25.7} y={271.38} nowrap={false} k="p1-cont-detail-note">
            รายละเอียดข้อมูลและพยานหลักฐานพร้อมแผนที่สังเขป ปรากฏตามเอกสารที่แนบมาพร้อมนี้
          </Lbl>
        </Sheet>
      ) : null}

      <Sheet index={narr2 ? 2 : 1}>
        <ExtraLines page={1} />
        <Lbl x={103.0} y={17}>
          {narr2 ? "๓" : "๒"}
        </Lbl>

        <Lbl x={24.5} y={28.6} nowrap={false}>
          ข้อ ๒. ผู้ร้องประสงค์จะทำการตรวจค้นบ้านหรือสถานที่ดังกล่าว เพื่อ
        </Lbl>

        <div
          style={{
            position: "absolute",
            left: "24.5mm",
            top: "40mm",
            width: "168.88mm",
            display: "flex",
            flexDirection: "column",
            gap: "0.4mm",
          }}
        >
          <CheckBox flow x={24.5} y={40.0} width={168.88} checked={fields.chk1} onToggle={() => onChange("chk1", !fields.chk1)} label="พบและยึดสิ่งของซึ่งจะเป็นพยานหลักฐานประกอบการสอบสวน ไต่สวนมูลฟ้องหรือพิจารณา" />
          <CheckBox flow x={24.5} y={40.0} width={168.88} checked={fields.chk2} onToggle={() => onChange("chk2", !fields.chk2)} label="พบและยึดสิ่งของซึ่งมีไว้เป็นความผิดหรือได้มาโดยผิดกฎหมาย หรือได้ใช้หรือตั้งใจจะใช้ในการกระทำความผิด" />
          <CheckBox flow x={24.5} y={40.0} width={168.88} checked={fields.chk3} onToggle={() => onChange("chk3", !fields.chk3)} label="พบและยึดสิ่งของตามคำพิพากษาหรือคำสั่งของศาลตามคำพิพากษาหรือคำสั่งในแบบมาพร้อมนี้" />
          <CheckBox flow x={24.5} y={40.0} width={168.88} checked={fields.chk4} onToggle={() => onChange("chk4", !fields.chk4)} label="พบบุคคลที่ถูกหน่วงเหนี่ยวหรือกักขังโดยมิชอบด้วยกฎหมาย" />
          <CheckBox flow x={24.5} y={40.0} width={168.88} checked={fields.chk5} onToggle={() => onChange("chk5", !fields.chk5)} label="พบบุคคลที่ถูกออกหมายจับตามสำเนาหมายจับที่แนบมาพร้อมนี้" />
        </div>

        <Lbl x={24.5} y={86.56}>
          จึงขอให้ทำลอกหมายค้นให้แก่
        </Lbl>
        <Line x0={72.5} x1={193.38} y={86.56} value={fields.copyTo} onChange={(v) => onChange("copyTo", v)} aria="ทำลอกหมายค้นให้แก่" />

        <Lbl x={24.5} y={94.32} nowrap={false}>
          ซึ่งเป็นหัวหน้าชุดในการตรวจค้นเพื่อเข้าตรวจค้น ในวันที่
        </Lbl>
        <AutoLinedField
          k="p2-headDate"
          aria="หัวหน้าชุดและวันที่ตรวจค้น"
          value={fields.searchDate}
          onChange={(v) => onChange("searchDate", v)}
          left={24.5}
          top={95.02}
          width={168.88}
          minLines={2}
          indent={90}
          firstLeft={114.5}
          firstWidth={78.88}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={109.84}>
          ตั้งแต่วลา
        </Lbl>
        <Line x0={41.0} x1={68.5} y={109.84} value={fields.searchTimeFrom} onChange={(v) => onChange("searchTimeFrom", v)} aria="เวลาตั้งแต่" />
        <Lbl x={69.5} y={109.84}>
          นาฬิกา ถึง เวลา
        </Lbl>
        <Line x0={98.0} x1={126.5} y={109.84} value={fields.searchTimeTo} onChange={(v) => onChange("searchTimeTo", v)} aria="เวลาถึง" />
        <Lbl x={24.5} y={117.6}>
          นาฬิกา ติดต่อกันไปจนกว่าจะเสร็จสิ้นการตรวจค้น
        </Lbl>

        <Lbl x={24.5} y={125.36}>
          ในการยื่นคำร้องนี้ ผู้ร้องได้มอบหมายให้
        </Lbl>
        <Line x0={102.0} x1={193.38} y={125.36} value={fields.assignee} onChange={(v) => onChange("assignee", v)} aria="ผู้รับมอบหมาย" />

        <Lbl x={24.5} y={133.12}>
          ตำแหน่ง
        </Lbl>
        <Line x0={39.5} x1={104.5} y={133.12} value={fields.assigneePosition} onChange={(v) => onChange("assigneePosition", v)} aria="ตำแหน่งผู้รับมอบหมาย" />
        <Lbl x={148.0} y={133.12}>
          ซึ่งเป็นผู้ใต้บังคับบัญชา
        </Lbl>

        <Lbl x={24.5} y={140.88} nowrap={false}>
          เป็นผู้ทำคำร้องนี้มาพร้อมต่อศาล และหากศาลเรียกสอบถามเมื่อใด ผู้ร้องพร้อมจะมาให้ศาลสอบปากคำได้ทันที
        </Lbl>

        <Lbl x={24.5} y={148.64}>
          ผู้ร้อง
        </Lbl>
        <CheckBox x={40.0} y={148.64} checked={fields.priorRequest} onToggle={() => onChange("priorRequest", true)} label="เคย" />
        <CheckBox x={62.0} y={148.64} checked={!fields.priorRequest} onToggle={() => onChange("priorRequest", false)} label="ไม่เคย" />
        <Lbl x={84.0} y={148.64}>
          ร้องขอให้ศาล
        </Lbl>
        <AutoLinedField
          k="p2-prior"
          aria="รายละเอียดคำร้อง"
          value={fields.priorLines}
          onChange={(v) => onChange("priorLines", v)}
          left={24.5}
          top={149.34}
          width={168.88}
          minLines={10}
          indent={90}
          firstLeft={114.5}
          firstWidth={78.88}
          restLeft={24.5}
          restWidth={168.88}
        />
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
