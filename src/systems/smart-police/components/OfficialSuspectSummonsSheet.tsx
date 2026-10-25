"use client";

import { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  SUSPECT_SUMMONS_AUTHORITY,
  SUSPECT_SUMMONS_RECEIPT_TEXT,
  SUSPECT_SUMMONS_RECEIPT_TAIL,
  SUSPECT_SUMMONS_TAIL_NOTE,
  type SuspectSummonsFields,
} from "@/lib/smart-police/form-templates/suspect-summons";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import {
  Lbl as SharedLbl,
  Line as SharedLine,
  SheetCtx,
} from "@/systems/smart-police/components/OfficialSearchWarrantRequestSheet";

/**
 * หมายเรียกผู้ต้องหา — ดัดแปลงจาก OfficialWitnessSummonsSheet (หมายเรียกพยาน)
 * เลย์เอาต์เหมือนกัน ต่างแค่: ชื่อแผ่น + «ครั้งที่» · กล่องคำเตือน 3 บรรทัด ·
 * ป้าย «ด้วยเหตุที่ท่านต้องหาว่า» · ข้อความใบรับหมาย (ไม่มีคำว่า «พยาน»)
 */
const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 20;
const AGENCY = 24;
const CASE_NO = 18;
const WARN = 11.8;
const RECEIPT_TITLE = 18;
const NOTE = 13.5;

const LINE = 7.76;
const RIGHT = 193.38;
/** ระยะจาก ytop ของบรรทัด → ขอบบนของเส้นจุดไข่ปลา */
const RULE_DY = 6.2;

/** ytop ของต้นฉบับ → top ของกล่อง span (line box สูง LINE, ตัวอักษรกึ่งกลาง) */
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
  // ใช้คอมโพเนนต์กลาง (รองรับโหมดจัดหน้า/ลาก/แก้ข้อความ) โดยแปลงชื่อ prop width → w
  return (
    <SharedLbl x={x} y={y} size={size} bold={bold} right={right} underline={underline} nowrap={nowrap} align={align} w={width}>
      {children}
    </SharedLbl>
  );
}

/** ช่องกรอก 1 บรรทัด — ตัวอักษรนั่งบนเส้นจุดไข่ปลา (เส้นจริงอยู่ที่ y+0.7 ในคอมโพเนนต์กลาง) */
function Line({
  label,
  labelX,
  x0,
  x1,
  y,
  value,
  onChange,
  aria,
  size,
}: {
  label?: string;
  labelX?: number;
  x0: number;
  x1: number;
  y: number;
  value: string;
  onChange: (v: string) => void;
  aria: string;
  size?: number;
}) {
  return (
    <>
      {label ? (
        <Lbl x={labelX ?? x0} y={y}>
          {label}
        </Lbl>
      ) : null}
      {/* เดิมเส้นอยู่ที่ y − 1.55 · คอมโพเนนต์กลางอยู่ที่ y + 0.7 จึงชดเชย 2.25 เพื่อให้ตำแหน่งเดิมคงที่ */}
      <SharedLine x0={x0} x1={x1} y={y - 2.25} value={value} onChange={onChange} aria={aria} size={size} />
    </>
  );
}

/** ช่องหลายบรรทัดบนเส้นจุดไข่ปลา — บรรทัดแรกเยื้องหลังป้าย บรรทัดถัดไปชิดซ้าย */
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
  const { edit } = useContext(SheetCtx);
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
          top: `${(textRuleStart - RULE_DY + 1.2).toFixed(2)}mm`,
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
          pointerEvents: edit ? "none" : "auto",
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
  label: "ด้วยเหตุที่ท่านต้องหาว่า",
  labelX: 25.37,
  labelY: 155.09,
  textX: 25.37,
  textIndent: 35.4,
  firstRuleY: 160.9,
  minLines: 2,
};

const ORDER = {
  key: "orderText" as const,
  label: "ฉะนั้นให้",
  labelX: 44.12,
  labelY: 170.58,
  textX: 44.12,
  textIndent: 13.1,
  firstRuleY: 176.4,
  minLines: 1,
};

export function OfficialSuspectSummonsDocument({
  fields,
  onChange,
  onPageCount,
  layout = emptySheetLayout(),
  edit = false,
  onDragStart,
  onResizeStart,
  onTextChange,
  onLineDrag,
  onLineResize,
  onToggleHidden,
}: {
  fields: SuspectSummonsFields;
  onChange: <K extends keyof SuspectSummonsFields>(key: K, value: SuspectSummonsFields[K]) => void;
  onPageCount?: (n: number) => void;
  layout?: SheetLayout;
  edit?: boolean;
  onDragStart?: (key: string, e: React.PointerEvent) => void;
  onResizeStart?: (key: string, e: React.PointerEvent) => void;
  onTextChange?: (key: string, text: string) => void;
  onLineDrag?: (id: string, e: React.PointerEvent) => void;
  onLineResize?: (id: string, e: React.PointerEvent) => void;
  onToggleHidden?: (key: string) => void;
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

  const pageCount = useMemo(() => (220 + shift + 75 > PAGE_H - 3 ? 2 : 1), [shift]);

  useLayoutEffect(() => {
    onPageCount?.(pageCount);
  }, [onPageCount, pageCount]);

  const reasonRuleStart = REASON.firstRuleY;
  const orderRuleStart = reasonRuleStart + (reasonLines - 1) * LINE + (ORDER.firstRuleY - (reasonRuleStart + LINE));

  return (
    <SheetCtx.Provider
      value={{ layout, edit, onDragStart, onResizeStart, onTextChange, onLineDrag, onLineResize, onToggleHidden }}
    >
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet index={0}>
        {/* ───────────── หัวแผ่น ───────────── */}
        <Lbl x={25.37} y={25.07} size={TITLE} bold>
          หมายเรียกผู้ต้องหา
        </Lbl>
        <Line labelX={25.37} label="ครั้งที่" x0={36.3} x1={48.0} y={33.5} value={fields.issueCount} onChange={(v) => onChange("issueCount", v)} aria="ครั้งที่" />

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
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          สำนักงานตำรวจแห่งชาติ
        </span>

        <div
          style={{
            position: "absolute",
            left: "133.04mm",
            top: "15.34mm",
            width: "63.11mm",
            height: "19.5mm",
            boxSizing: "border-box",
            border: "0.75pt solid #c00000",
            color: "#ff0000",
            fontSize: `${WARN}pt`,
            fontWeight: 400,
            lineHeight: "6.06mm",
            padding: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {[
            ["คำเตือน ", "หากท่านไม่มาตามหมายเรียก"],
            ["", "พนักงานสอบสวนจะขอให้ศาลออกหมาย"],
            ["", "จับกุมตัวท่านมาดำเนินคดีตามกฎหมาย"],
          ].map(([head, body], i) => (
            <span
              key={`warn-${i}`}
              style={{
                position: "absolute",
                left: "2.2mm",
                top: `${(2.3 + i * 6.06).toFixed(2)}mm`,
                lineHeight: "6.06mm",
                whiteSpace: "nowrap",
              }}
            >
              {head ? (
                <span style={{ textDecoration: "underline", textUnderlineOffset: "0.5mm" }}>{head.trim()}</span>
              ) : null}
              {head ? " " : ""}
              {body}
            </span>
          ))}
        </div>

        {/* ───────────── หัวสถานที่ออกหมาย ───────────── */}
        <Line labelX={72.87} label="สถานที่ออกหมาย" x0={99.71} x1={192.7} y={59.82} value={fields.issuePlace} onChange={(v) => onChange("issuePlace", v)} aria="สถานที่ออกหมาย" />
        <Line labelX={82.86} label="ออกหมายวันที่" x0={105.48} x1={120.21} y={67.57} value={fields.issueDay} onChange={(v) => onChange("issueDay", v)} aria="วันที่ออกหมาย" />
        <Line labelX={120.38} label="เดือน" x0={128.51} x1={162.55} y={67.57} value={fields.issueMonth} onChange={(v) => onChange("issueMonth", v)} aria="เดือนที่ออกหมาย" />
        <Line labelX={162.89} label="พ.ศ." x0={169.83} x1={192.7} y={67.57} value={fields.issueYear} onChange={(v) => onChange("issueYear", v)} aria="ปีพุทธศักราชที่ออกหมาย" />

        {/* ความอาญา — ต้นฉบับไม่มีเส้นจุดไข่ปลา */}
        <Lbl x={92.85} y={74.71} size={CASE_NO}>
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

        <Lbl x={44.12} y={116.26} nowrap={false} width={139.3}>
          {SUSPECT_SUMMONS_AUTHORITY}
        </Lbl>

        {/* ───────────── ที่อยู่ผู้รับหมาย ───────────── */}
        <Line labelX={44.12} label="หมายมายัง" x0={61.14} x1={192.74} y={124.01} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="หมายมายัง" />

        <Line labelX={25.37} label="บ้านเลขที่" x0={40.44} x1={100.9} y={131.81} value={fields.houseNo} onChange={(v) => onChange("houseNo", v)} aria="บ้านเลขที่" />
        <Line labelX={101.66} label="ถนน" x0={108.78} x1={139.77} y={131.81} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={140.4} label="แขวง/ตำบล" x0={159.38} x1={RIGHT} y={131.81} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="แขวงหรือตำบล" />

        <Line labelX={25.37} label="เขต/อำเภอ" x0={42.64} x1={141.67} y={139.55} value={fields.district} onChange={(v) => onChange("district", v)} aria="เขตหรืออำเภอ" />
        <Line labelX={141.67} label="จังหวัด" x0={152.52} x1={RIGHT} y={139.55} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />

        <Line labelX={25.37} label="ผู้ใหญ่บ้าน" x0={41.71} x1={100.14} y={147.3} value={fields.headman} onChange={(v) => onChange("headman", v)} aria="ผู้ใหญ่บ้าน" />
        <Line labelX={100.39} label="กำนัน" x0={109.41} x1={193.25} y={147.3} value={fields.kamnan} onChange={(v) => onChange("kamnan", v)} aria="กำนัน" />

        {/* ───────────── ด้วยเหตุ / ฉะนั้นให้ ───────────── */}
        <FlowField spec={REASON} lines={reasonLines} textRuleStart={reasonRuleStart} value={fields.reason} onChange={(v) => onChange("reason", v)} />
        <FlowField spec={ORDER} lines={orderLines} textRuleStart={orderRuleStart} value={fields.orderText} onChange={(v) => onChange("orderText", v)} />

        {/* ───────────── นัดพบ — เส้นเดียวต่อเนื่อง พิมพ์เองได้ทั้งแถว ───────────── */}
        <Lbl x={25.37} y={y(178.37)}>
          ไป ณ ที่
        </Lbl>
        <span
          className="sp-rule-cell"
          style={{
            position: "absolute",
            left: "37.56mm",
            top: `${(y(178.37) - 1.55).toFixed(2)}mm`,
            width: `${(RIGHT - 37.56).toFixed(2)}mm`,
            height: `${RULE_DY.toFixed(2)}mm`,
            borderBottom: "0.5pt dotted #111",
            boxSizing: "border-box",
          }}
        >
          <input
            aria-label="สถานที่ให้ไปพบและพนักงานสอบสวนเจ้าของคดี"
            value={fields.placeToGo}
            onChange={(e) => onChange("placeToGo", e.target.value)}
            spellCheck={false}
            className="sp-bare-field"
            style={{
              display: "block",
              width: "100%",
              minWidth: 0,
              height: "100%",
              fontFamily: FONT,
              fontSize: `${BODY}pt`,
              fontWeight: 400,
              lineHeight: `${LINE.toFixed(2)}mm`,
              boxSizing: "border-box",
              padding: 0,
            }}
          />
        </span>

        <Line labelX={25.37} label="ในวันที่" x0={36.37} x1={55.17} y={y(186.13)} value={fields.appointDay} onChange={(v) => onChange("appointDay", v)} aria="วันนัดพบ" />
        <Line labelX={55.34} label="เดือน" x0={63.48} x1={95.35} y={y(186.13)} value={fields.appointMonth} onChange={(v) => onChange("appointMonth", v)} aria="เดือนนัดพบ" />
        <Line labelX={95.35} label="พ.ศ." x0={102.29} x1={122.11} y={y(186.13)} value={fields.appointYear} onChange={(v) => onChange("appointYear", v)} aria="ปีพุทธศักราชนัดพบ" />
        <Line labelX={122.88} label="เวลา" x0={130.33} x1={162.34} y={y(186.13)} value={fields.appointTime} onChange={(v) => onChange("appointTime", v)} aria="เวลานัดพบ" />
        <Lbl x={162.89} y={y(186.13)}>
          นาฬิกา
        </Lbl>

        {/* ───────────── ลงชื่อผู้ออกหมาย ───────────── */}
        <Line labelX={110.39} label="ลงชื่อ" x0={118.98} x1={172.33} y={y(193.88)} value={fields.signName} onChange={(v) => onChange("signName", v)} aria="ลงชื่อผู้ออกหมาย" />
        <Lbl x={172.88} y={y(193.88)}>
          ผู้ออกหมาย
        </Lbl>

        <Lbl x={117.92} y={y(200.78)}>
          (
        </Lbl>
        <Line x0={120.6} x1={172.6} y={y(200.78)} value={fields.signPrinted} onChange={(v) => onChange("signPrinted", v)} aria="ชื่อตัวบรรจงผู้ออกหมาย" />
        <Lbl x={172.92} y={y(200.78)}>
          )
        </Lbl>

        <Line labelX={105.39} label="ตำแหน่ง" x0={118.52} x1={172.88} y={y(209.41)} value={fields.signPosition} onChange={(v) => onChange("signPosition", v)} aria="ตำแหน่งผู้ออกหมาย" />
        <Line labelX={112.97} label="โทร" x0={118.52} x1={172.88} y={y(216.82)} value={fields.signPhone} onChange={(v) => onChange("signPhone", v)} aria="โทรศัพท์ผู้ออกหมาย" />

        {/* ───────────── ใบรับหมายตำรวจ ───────────── */}
        <div
          aria-hidden
          style={{ position: "absolute", left: "0.79mm", width: "207.70mm", top: `${y(225.61).toFixed(2)}mm`, borderTop: "0.75pt dashed #111" }}
        />

        <Lbl x={25.15} y={y(225.19)} size={RECEIPT_TITLE} width={167.56} align="center" underline bold nowrap={false}>
          ใบรับหมายตำรวจ
        </Lbl>

        <Line labelX={60.37} label="วันที่" x0={67.41} x1={87.22} y={y(233.76)} value={fields.receiptDay} onChange={(v) => onChange("receiptDay", v)} aria="วันที่รับหมาย" />
        <Line labelX={87.86} label="เดือน" x0={95.99} x1={127.87} y={y(233.76)} value={fields.receiptMonth} onChange={(v) => onChange("receiptMonth", v)} aria="เดือนที่รับหมาย" />
        <Line labelX={127.87} label="พ.ศ." x0={134.81} x1={152.6} y={y(233.76)} value={fields.receiptYear} onChange={(v) => onChange("receiptYear", v)} aria="ปีพุทธศักราชที่รับหมาย" />
        <Line labelX={152.9} label="เวลา" x0={160.35} x1={180.16} y={y(233.76)} value={fields.receiptTime} onChange={(v) => onChange("receiptTime", v)} aria="เวลารับหมาย" />
        <Lbl x={180.42} y={y(233.76)}>
          นาฬิกา
        </Lbl>

        <Line labelX={25.37} label="ข้าพเจ้า" x0={37.6} x1={86.6} y={y(241.51)} value={fields.receiptName} onChange={(v) => onChange("receiptName", v)} aria="ชื่อผู้รับหมาย" />
        <Lbl x={87.86} y={y(241.51)}>
          {SUSPECT_SUMMONS_RECEIPT_TEXT}
        </Lbl>
        <Line x0={162.0} x1={193.0} y={y(241.51)} value={fields.receiptRelation} onChange={(v) => onChange("receiptRelation", v)} aria="รายละเอียดเพิ่มเติมในใบรับหมาย" />

        <Line x0={25.37} x1={87.86} y={y(249.3)} value={fields.receiptPlace} onChange={(v) => onChange("receiptPlace", v)} aria="ผู้มอบหมายในใบรับหมาย" />
        <Lbl x={87.86} y={y(249.3)}>
          ซึ่งกำหนดให้ข้าพเจ้าไปยัง
        </Lbl>
        <Line x0={127.45} x1={193.0} y={y(249.3)} value={fields.appointPlace2} onChange={(v) => onChange("appointPlace2", v)} aria="สถานที่ที่กำหนดให้ไปในใบรับหมาย" />

        <Line labelX={25.37} label="ในวันที่" x0={36.37} x1={60.25} y={y(257.05)} value={fields.appointDay2} onChange={(v) => onChange("appointDay2", v)} aria="วันนัดพบในใบรับหมาย" />
        <Line labelX={60.37} label="เดือน" x0={68.51} x1={97.47} y={y(257.05)} value={fields.appointMonth2} onChange={(v) => onChange("appointMonth2", v)} aria="เดือนนัดพบในใบรับหมาย" />
        <Line labelX={97.89} label="พ.ศ." x0={104.84} x1={129.73} y={y(257.05)} value={fields.appointYear2} onChange={(v) => onChange("appointYear2", v)} aria="ปีพุทธศักราชนัดพบในใบรับหมาย" />
        <Line labelX={130.41} label="เวลา" x0={137.86} x1={167.84} y={y(257.05)} value={fields.appointTime2} onChange={(v) => onChange("appointTime2", v)} aria="เวลานัดพบในใบรับหมาย" />
        <Lbl x={167.89} y={y(257.05)}>
          นาฬิกา {SUSPECT_SUMMONS_RECEIPT_TAIL}
        </Lbl>

        <Lbl x={115.38} y={y(266.91)}>
          (ลงชื่อ)
        </Lbl>
        <Line x0={126.64} x1={174.91} y={y(266.91)} value={fields.receiverName} onChange={(v) => onChange("receiverName", v)} aria="ชื่อผู้รับหมาย" />
        <Lbl right={193.4} y={y(266.91)}>
          ผู้รับหมาย
        </Lbl>

        <Lbl x={115.38} y={y(274.7)}>
          (ลงชื่อ)
        </Lbl>
        <Line x0={126.64} x1={174.91} y={y(274.7)} value={fields.delivererName} onChange={(v) => onChange("delivererName", v)} aria="ชื่อผู้ส่งหมาย" />
        <Lbl right={191.86} y={y(274.7)}>
          ผู้ส่งหมาย
        </Lbl>

        <span
          style={{
            ...PROSE,
            left: "26.68mm",
            top: `${topFor(y(283.09), NOTE).toFixed(2)}mm`,
            fontSize: `${NOTE}pt`,
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {SUSPECT_SUMMONS_TAIL_NOTE}
        </span>
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
