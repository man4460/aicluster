"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  DOCUMENT_SUMMONS_AUTHORITY,
  type DocumentSummonsFields,
} from "@/lib/smart-police/form-templates/document-summons";

/**
 * หมายเรียกพยานเอกสาร — ดัดแปลงจาก OfficialWitnessSummonsSheet
 * ต่าง: ไม่มีกล่องคำเตือน · ไม่มีใบรับหมายท้ายแผ่น · มาตรา ๑๓๒ (๔) ·
 * พื้นที่ «ด้วยเหตุ» กว้าง 9 บรรทัด (ฉะนั้นให้ + ส่วนล่างเลื่อนลง ~54mm) ·
 * หัวแผ่นมี «ที่ [เลข]» + ชื่อ «หมายเรียกพยานเอกสาร»
 */
const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 20;
const AGENCY = 24;
const CASE_NO = 18;

const LINE = 7.76;
const RIGHT = 193.38;
const RULE_DY = 6.2;

function topFor(y: number, size: number): number {
  return y + 0.1227 * size - 1.267;
}

const PROSE: CSSProperties = {
  position: "absolute",
  lineHeight: `${LINE}mm`,
};

function Lbl({
  x,
  y,
  children,
  size = BODY,
  bold = false,
  right,
  underline = false,
  nowrap = true,
  align,
  width,
}: {
  x?: number;
  y: number;
  children: ReactNode;
  size?: number;
  bold?: boolean;
  right?: number;
  underline?: boolean;
  nowrap?: boolean;
  align?: CSSProperties["textAlign"];
  width?: number;
}) {
  return (
    <span
      style={{
        ...PROSE,
        top: `${topFor(y, size).toFixed(2)}mm`,
        fontSize: `${size}pt`,
        fontWeight: bold ? 700 : 400,
        textDecoration: underline ? "underline" : undefined,
        textUnderlineOffset: "0.9mm",
        whiteSpace: nowrap ? "nowrap" : "normal",
        ...(right !== undefined ? { right: `${(PAGE_W - right).toFixed(2)}mm` } : { left: `${(x ?? 0).toFixed(2)}mm` }),
        ...(width !== undefined ? { width: `${width}mm` } : {}),
        ...(align ? { textAlign: align } : {}),
      }}
    >
      {children}
    </span>
  );
}

function Line({
  label,
  labelX,
  x0,
  x1,
  y,
  value,
  onChange,
  aria,
  bold = false,
  size = BODY,
  dotted = true,
}: {
  label?: string;
  labelX?: number;
  x0: number;
  x1: number;
  y: number;
  value: string;
  onChange: (v: string) => void;
  aria: string;
  bold?: boolean;
  size?: number;
  dotted?: boolean;
}) {
  return (
    <>
      {label ? (
        <Lbl x={labelX ?? x0} y={y} size={size}>
          {label}
        </Lbl>
      ) : null}
      <span
        className="sp-rule-cell"
        style={{
          position: "absolute",
          left: `${x0.toFixed(2)}mm`,
          top: `${(y + 0.7).toFixed(2)}mm`,
          width: `${Math.max(2, x1 - x0).toFixed(2)}mm`,
          height: `${RULE_DY.toFixed(2)}mm`,
          borderBottom: dotted ? "0.5pt dotted #111" : undefined,
          boxSizing: "border-box",
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
            fontSize: `${size}pt`,
            fontWeight: bold ? 700 : 400,
            lineHeight: `${LINE.toFixed(2)}mm`,
            boxSizing: "border-box",
            padding: 0,
            textAlign: "left",
            textIndent: "4mm",
          }}
        />
      </span>
    </>
  );
}

function FlowField({
  spec,
  lines,
  textRuleStart,
  value,
  onChange,
}: {
  spec: { key: "reason" | "orderText"; label: string; labelX: number; labelY: number; textX: number; textIndent: number };
  lines: number;
  textRuleStart: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={`${spec.key}-r${i}`}
          aria-hidden
          style={{
            position: "absolute",
            left: `${spec.textX.toFixed(2)}mm`,
            width: `${(RIGHT - spec.textX).toFixed(2)}mm`,
            top: `${(textRuleStart + i * LINE).toFixed(2)}mm`,
            borderTop: "0.5pt dotted #111",
          }}
        />
      ))}
      <Lbl x={spec.labelX} y={spec.labelY}>
        {spec.label}
      </Lbl>
      <textarea
        aria-label={spec.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          left: `${spec.textX.toFixed(2)}mm`,
          width: `${(RIGHT - spec.textX).toFixed(2)}mm`,
          top: `${(textRuleStart - RULE_DY).toFixed(2)}mm`,
          height: `${(lines * LINE).toFixed(2)}mm`,
          fontFamily: FONT,
          fontSize: `${BODY}pt`,
          fontWeight: 400,
          lineHeight: `${LINE}mm`,
          color: "#111",
          textIndent: `${spec.textIndent.toFixed(2)}mm`,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          resize: "none",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          overflow: "hidden",
        }}
      />
    </>
  );
}

function Brace({ top, height }: { top: number; height: number }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", left: "44.2mm", top: `${top.toFixed(2)}mm`, width: "3.4mm", height: `${height.toFixed(2)}mm` }}
    >
      <svg viewBox="0 0 24 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path
          d="M21 1 C9 1 6 12 6 24 L6 39 C6 47 2 50 2 50 C2 50 6 53 6 61 L6 76 C6 88 9 99 21 99"
          fill="none"
          stroke="#111"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Sheet({ children, index }: { children: ReactNode; index: number }) {
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

function measureLines(host: HTMLDivElement, text: string, indentMm: number): number {
  if (!text) return 0;
  host.style.textIndent = `${indentMm}mm`;
  host.textContent = text;
  const lh = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(lh) || lh <= 0) return Math.ceil(text.length / 80);
  return Math.max(1, Math.round(host.scrollHeight / lh));
}

const REASON = {
  key: "reason" as const,
  label: "ด้วยเหตุ",
  labelX: 25.37,
  labelY: 156.8,
  textX: 25.37,
  textIndent: 12.48,
  firstRuleY: 163.5,
  minLines: 8,
};

const ORDER = {
  key: "orderText" as const,
  label: "ฉะนั้นให้",
  labelX: 44.12,
  labelY: 223.4,
  textX: 44.12,
  textIndent: 13.1,
  firstRuleY: 230.56,
  minLines: 1,
};

export function OfficialDocumentSummonsDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: DocumentSummonsFields;
  onChange: <K extends keyof DocumentSummonsFields>(key: K, value: DocumentSummonsFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [, setMeasureReady] = useState(false);

  useLayoutEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:absolute",
      "left:-9999mm",
      "top:0",
      `width:${RIGHT - REASON.textX}mm`,
      "visibility:hidden",
      "pointer-events:none",
      `font-family:${FONT}`,
      `font-size:${BODY}pt`,
      "font-weight:400",
      `line-height:${LINE}mm`,
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
      "word-break:break-word",
    ].join(";");
    document.body.appendChild(host);
    hostRef.current = host;
    setMeasureReady(true);
    return () => {
      host.remove();
      hostRef.current = null;
    };
  }, []);

  const countLines = useCallback((text: string, indentMm: number) => {
    const host = hostRef.current;
    if (!host) return Math.max(1, Math.ceil(text.length / 80));
    return measureLines(host, text, indentMm);
  }, []);

  const reasonLines = Math.max(REASON.minLines, countLines(fields.reason, REASON.textIndent));
  const orderLines = Math.max(ORDER.minLines, countLines(fields.orderText, ORDER.textIndent));
  const shift = (reasonLines - REASON.minLines + (orderLines - ORDER.minLines)) * LINE;

  const y = (base: number) => (base > ORDER.firstRuleY ? base + shift : base);

  const pageCount = useMemo(() => (232.5 + shift + 40 > PAGE_H - 3 ? 2 : 1), [shift]);

  useLayoutEffect(() => {
    onPageCount?.(pageCount);
  }, [onPageCount, pageCount]);

  const reasonRuleStart = REASON.firstRuleY;
  const orderRuleStart =
    reasonRuleStart + (reasonLines - 1) * LINE + (ORDER.firstRuleY - (reasonRuleStart + (REASON.minLines - 1) * LINE));

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet index={0}>
        {/* ───────────── หัวแผ่น ───────────── */}
        <Lbl x={25.37} y={25.6}>
          ที่
        </Lbl>
        <Line x0={29.0} x1={80.0} y={25.6} value={fields.docNo} onChange={(v) => onChange("docNo", v)} aria="เลขที่หนังสือ" />
        <Lbl x={25.37} y={32.7} size={TITLE} bold>
          หมายเรียกพยานเอกสาร
        </Lbl>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smart-police/garuda.png"
          alt=""
          width={96}
          height={110}
          style={{ position: "absolute", left: "88.6mm", top: "21.4mm", width: "26.4mm", height: "26.8mm", objectFit: "contain" }}
        />

        <span
          style={{
            ...PROSE,
            left: "73.0mm",
            top: `${topFor(49.62, AGENCY).toFixed(2)}mm`,
            fontSize: `${AGENCY}pt`,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          สำนักงานตำรวจแห่งชาติ
        </span>

        {/* ───────────── หัวสถานที่ออกหมาย ───────────── */}
        <Line labelX={72.87} label="สถานที่ออกหมาย" x0={99.71} x1={192.7} y={59.82} value={fields.issuePlace} onChange={(v) => onChange("issuePlace", v)} aria="สถานที่ออกหมาย" />
        <Line labelX={82.86} label="ออกหมายวันที่" x0={105.48} x1={120.21} y={67.57} value={fields.issueDay} onChange={(v) => onChange("issueDay", v)} aria="วันที่ออกหมาย" />
        <Line labelX={120.38} label="เดือน" x0={128.51} x1={162.55} y={67.57} value={fields.issueMonth} onChange={(v) => onChange("issueMonth", v)} aria="เดือนที่ออกหมาย" />
        <Line labelX={162.89} label="พ.ศ." x0={169.83} x1={192.7} y={67.57} value={fields.issueYear} onChange={(v) => onChange("issueYear", v)} aria="ปีพุทธศักราชที่ออกหมาย" />

        <Lbl x={92.85} y={74.71} size={CASE_NO} bold>
          ความอาญา
        </Lbl>
        <Line
          x0={113.5}
          x1={192.7}
          y={74.71}
          value={fields.caseNo}
          onChange={(v) => onChange("caseNo", v)}
          aria="ความอาญา"
          size={CASE_NO}
          dotted={false}
        />

        {/* ───────────── คดีระหว่าง ───────────── */}
        <Brace top={88.9} height={25.2} />
        <Lbl x={25.37} y={95.6}>
          คดีระหว่าง
        </Lbl>
        <Line x0={47.84} x1={177.41} y={83.12} value={fields.complainant} onChange={(v) => onChange("complainant", v)} aria="ผู้กล่าวหา" />
        <Lbl right={194.4} y={83.12}>
          ผู้กล่าวหา
        </Lbl>
        <Line x0={47.84} x1={180.42} y={106.4} value={fields.suspect} onChange={(v) => onChange("suspect", v)} aria="ผู้ต้องหา" />
        <Lbl right={194.69} y={106.4}>
          ผู้ต้องหา
        </Lbl>

        <Lbl x={44.12} y={116.26} nowrap={false} width={143}>
          {DOCUMENT_SUMMONS_AUTHORITY}
        </Lbl>

        {/* ───────────── ที่อยู่ผู้รับหมาย ───────────── */}
        <Line labelX={44.12} label="หมายมายัง" x0={61.14} x1={192.74} y={124.01} value={fields.summonedName} onChange={(v) => onChange("summonedName", v)} aria="หมายมายัง" />

        <Line labelX={25.37} label="บ้านเลขที่" x0={40.44} x1={100.9} y={131.81} value={fields.houseNo} onChange={(v) => onChange("houseNo", v)} aria="บ้านเลขที่" />
        <Line labelX={101.66} label="ถนน" x0={108.78} x1={139.77} y={131.81} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={140.4} label="แขวง/ตำบล" x0={159.38} x1={RIGHT} y={131.81} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="แขวงหรือตำบล" />

        <Line labelX={25.37} label="เขต/อำเภอ" x0={42.64} x1={141.67} y={139.55} value={fields.district} onChange={(v) => onChange("district", v)} aria="เขตหรืออำเภอ" />
        <Line labelX={141.67} label="จังหวัด" x0={152.52} x1={RIGHT} y={139.55} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />

        <Line labelX={25.37} label="ผู้ใหญ่บ้าน" x0={41.71} x1={100.14} y={147.3} value={fields.headman} onChange={(v) => onChange("headman", v)} aria="ผู้ใหญ่บ้าน" />
        <Line labelX={100.39} label="กำนัน" x0={109.41} x1={193.25} y={147.3} value={fields.kamnan} onChange={(v) => onChange("kamnan", v)} aria="กำนัน" />

        {/* ───────────── ด้วยเหตุ (พื้นที่กว้าง) / ฉะนั้นให้ ───────────── */}
        <FlowField spec={REASON} lines={reasonLines} textRuleStart={reasonRuleStart} value={fields.reason} onChange={(v) => onChange("reason", v)} />
        <FlowField spec={ORDER} lines={orderLines} textRuleStart={orderRuleStart} value={fields.orderText} onChange={(v) => onChange("orderText", v)} />

        {/* ───────────── นัดพบ ───────────── */}
        <Lbl x={25.37} y={y(232.49)}>
          ไป ณ ที่
        </Lbl>
        <span
          className="sp-rule-cell"
          style={{
            position: "absolute",
            left: "37.56mm",
            top: `${(y(232.49) + 0.7).toFixed(2)}mm`,
            width: `${(RIGHT - 37.56).toFixed(2)}mm`,
            height: `${RULE_DY.toFixed(2)}mm`,
            borderBottom: "0.5pt dotted #111",
            boxSizing: "border-box",
          }}
        >
          <input
            aria-label="สถานที่ให้ไปพบ"
            value={fields.placeToGo}
            onChange={(e) => onChange("placeToGo", e.target.value)}
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
              fontWeight: 400,
              lineHeight: `${LINE.toFixed(2)}mm`,
              boxSizing: "border-box",
              padding: 0,
              textAlign: "left",
              textIndent: "4mm",
            }}
          />
        </span>

        <Line labelX={25.37} label="ในวันที่" x0={36.37} x1={55.17} y={y(240.25)} value={fields.appointDay} onChange={(v) => onChange("appointDay", v)} aria="วันนัดพบ" />
        <Line labelX={55.34} label="เดือน" x0={63.48} x1={95.35} y={y(240.25)} value={fields.appointMonth} onChange={(v) => onChange("appointMonth", v)} aria="เดือนนัดพบ" />
        <Line labelX={95.35} label="พ.ศ." x0={102.29} x1={122.11} y={y(240.25)} value={fields.appointYear} onChange={(v) => onChange("appointYear", v)} aria="ปีพุทธศักราชนัดพบ" />
        <Line labelX={122.88} label="เวลา" x0={130.33} x1={162.34} y={y(240.25)} value={fields.appointTime} onChange={(v) => onChange("appointTime", v)} aria="เวลานัดพบ" />
        <Lbl x={162.89} y={y(240.25)}>
          นาฬิกา
        </Lbl>

        {/* ───────────── ลงชื่อผู้ออกหมาย ───────────── */}
        <Line labelX={110.39} label="ลงชื่อ" x0={118.98} x1={172.33} y={y(248.0)} value={fields.signName} onChange={(v) => onChange("signName", v)} aria="ลงชื่อผู้ออกหมาย" />
        <Lbl x={172.88} y={y(248.0)}>
          ผู้ออกหมาย
        </Lbl>

        <Lbl x={117.92} y={y(254.9)}>
          (
        </Lbl>
        <Line x0={120.6} x1={172.6} y={y(254.9)} value={fields.signPrinted} onChange={(v) => onChange("signPrinted", v)} aria="ชื่อตัวบรรจงผู้ออกหมาย" />
        <Lbl x={172.92} y={y(254.9)}>
          )
        </Lbl>

        <Line labelX={105.39} label="ตำแหน่ง" x0={118.52} x1={172.88} y={y(263.53)} value={fields.signPosition} onChange={(v) => onChange("signPosition", v)} aria="ตำแหน่งผู้ออกหมาย" />
        <Line labelX={112.97} label="โทร" x0={118.52} x1={172.88} y={y(270.94)} value={fields.signPhone} onChange={(v) => onChange("signPhone", v)} aria="โทรศัพท์ผู้ออกหมาย" />
      </Sheet>
    </div>
  );
}
