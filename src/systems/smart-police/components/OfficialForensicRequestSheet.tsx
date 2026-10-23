"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FORENSIC_REQUEST_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  FORENSIC_REQUEST_INTRO,
  FORENSIC_REQUEST_LIST_MIN,
  addForensicRequestListItem,
  packForensicRequestPages,
  removeLastForensicRequestListItem,
  type ForensicRequestFields,
  type ForensicRequestFlowKey,
  type ForensicRequestPageSlice,
} from "@/lib/smart-police/form-templates/forensic-request";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "18pt";
const LINE = "7.2mm";
const SIGN_LINE = "6.7mm";

function Dot({
  value,
  onChange,
  "aria-label": ariaLabel,
  minCh = 4,
  flex,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  minCh?: number;
  flex?: boolean;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field align-baseline", flex ? "min-w-0 flex-1" : "inline")}
      style={{
        minWidth: flex ? 0 : `${minCh}ch`,
        width: flex ? "100%" : `${Math.max(minCh, (value || "").length + 1)}ch`,
        fontSize: "inherit",
        lineHeight: "inherit",
        height: "auto",
        paddingBottom: "1px",
      }}
    />
  );
}

function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "baseline",
        gap: "0 1.5mm",
        minHeight: LINE,
        margin: "0 0 0.45mm",
        lineHeight: LINE,
        fontSize: BODY,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function T({ children }: { children: ReactNode }) {
  return <span style={{ flexShrink: 0, fontWeight: 700 }}>{children}</span>;
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function ListTools({
  addAria,
  removeAria,
  onAdd,
  onRemove,
  canRemove,
}: {
  addAria: string;
  removeAria: string;
  onAdd: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-px print:hidden" style={{ margin: "0 0 0.8mm" }}>
      <button
        type="button"
        aria-label={addAria}
        title={addAria}
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[#4d47b6] hover:bg-slate-100"
        onClick={onAdd}
      >
        <IconPlus className="h-2.5 w-2.5" />
      </button>
      {canRemove ? (
        <button
          type="button"
          aria-label={removeAria}
          title={removeAria}
          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-rose-500 hover:bg-rose-50"
          onClick={onRemove}
        >
          <IconMinus className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </div>
  );
}

function Sheet({ children, index }: { children: ReactNode; index: number }) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "12mm 16mm 14mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </article>
  );
}

function FieldLines({
  label,
  value,
  onChange,
  lines,
  ariaLabel,
  showLabel = true,
  indentMm = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
  showLabel?: boolean;
  indentMm?: number;
}) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [indentPx, setIndentPx] = useState(0);

  useLayoutEffect(() => {
    if (!showLabel || !labelRef.current) {
      setIndentPx(0);
      return;
    }
    const parent = labelRef.current.parentElement;
    const labelW = labelRef.current.getBoundingClientRect().width;
    const max = parent ? Math.max(48, parent.clientWidth - 48) : labelW + 8;
    setIndentPx(Math.ceil(Math.min(labelW + 8, max)));
  }, [showLabel, label]);

  const indent = showLabel
    ? indentPx > 0
      ? `${indentPx}px`
      : `calc(${label.length + 1}ch + 1.5mm)`
    : "0";

  return (
    <div
      style={{
        position: "relative",
        margin: "0 0 0.4mm",
        marginLeft: indentMm ? `${indentMm}mm` : undefined,
        height: `calc(${lines} * ${LINE})`,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            style={{ height: LINE, borderBottom: "0.5pt dotted #111", boxSizing: "border-box" }}
          />
        ))}
      </div>
      {showLabel ? (
        <span
          ref={labelRef}
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: LINE,
            lineHeight: LINE,
            fontWeight: 700,
            pointerEvents: "none",
            zIndex: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      ) : null}
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          fontFamily: "inherit",
          fontSize: BODY,
          lineHeight: LINE,
          color: "#111",
          textIndent: indent,
        }}
      />
    </div>
  );
}

function measureHostLines(host: HTMLDivElement, text: string, indentCh: number): number {
  if (!text) return 0;
  host.style.textIndent = indentCh > 0 ? `calc(${indentCh}ch + 1.5mm)` : "0";
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return estimateLines(text, indentCh);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialForensicRequestDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: ForensicRequestFields;
  onChange: <K extends keyof ForensicRequestFields>(key: K, value: ForensicRequestFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);

  useLayoutEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "width:178mm",
      "visibility:hidden",
      "pointer-events:none",
      `font-family:${FONT}`,
      `font-size:${BODY}`,
      `line-height:${LINE}`,
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

  const countLines = useCallback(
    (text: string, indentCh: number) => {
      const host = hostRef.current;
      if (!host) return estimateLines(text, indentCh);
      return measureHostLines(host, text, indentCh);
    },
    [measureReady],
  );

  const pages = useMemo(() => packForensicRequestPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: ForensicRequestFlowKey, itemIndex: number, sliceIndex: number, text: string) {
    if (key === "exhibit" || key === "purpose") {
      const listKey = key === "exhibit" ? "exhibits" : "purposes";
      const slices = pages.flatMap((p) => p.slices.filter((s) => s.key === key && s.itemIndex === itemIndex));
      const next = slices.map((s, i) => (i === sliceIndex ? text : s.text)).join("");
      const list = [...fields[listKey]];
      list[itemIndex] = next;
      onChange(listKey, list);
      return;
    }
    const slices = pages.flatMap((p) => p.slices.filter((s) => s.key === key));
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  function isLastListSlice(slice: ForensicRequestPageSlice) {
    if (slice.key !== "exhibit" && slice.key !== "purpose") return false;
    const list = slice.key === "exhibit" ? fields.exhibits : fields.purposes;
    if (slice.itemIndex !== Math.max(0, list.length - 1)) return false;
    const last = pages
      .flatMap((p) => p.slices)
      .filter((s) => s.key === slice.key && s.itemIndex === slice.itemIndex)
      .at(-1);
    return Boolean(
      last && last.sliceIndex === slice.sliceIndex && last.itemIndex === slice.itemIndex && last.key === slice.key,
    );
  }

  function renderSlice(slice: ForensicRequestPageSlice) {
    const lastList = isLastListSlice(slice);
    return (
      <div key={`${slice.key}-${slice.itemIndex}-${slice.sliceIndex}`} style={{ flexShrink: 0 }}>
        {slice.showHeading ? (
          <p
            style={{
              margin: "0.8mm 0 0.2mm",
              fontSize: BODY,
              lineHeight: LINE,
              fontWeight: 700,
            }}
          >
            {slice.heading}
          </p>
        ) : null}
        <FieldLines
          label={slice.label}
          value={slice.text}
          onChange={(v) => patchFlow(slice.key, slice.itemIndex, slice.sliceIndex, v)}
          lines={slice.lines}
          showLabel={slice.showLabel}
          indentMm={slice.indentMm}
          ariaLabel={slice.showLabel ? slice.label : `${slice.label} (ต่อ)`}
        />
        {lastList && slice.key === "exhibit" ? (
          <ListTools
            addAria="เพิ่มข้อ ๘"
            removeAria="ลบข้อ ๘ สุดท้าย"
            onAdd={() => onChange("exhibits", addForensicRequestListItem(fields.exhibits))}
            onRemove={() => onChange("exhibits", removeLastForensicRequestListItem(fields.exhibits))}
            canRemove={fields.exhibits.length > FORENSIC_REQUEST_LIST_MIN}
          />
        ) : null}
        {lastList && slice.key === "purpose" ? (
          <ListTools
            addAria="เพิ่มข้อ ๙"
            removeAria="ลบข้อ ๙ สุดท้าย"
            onAdd={() => onChange("purposes", addForensicRequestListItem(fields.purposes))}
            onRemove={() => onChange("purposes", removeLastForensicRequestListItem(fields.purposes))}
            canRemove={fields.purposes.length > FORENSIC_REQUEST_LIST_MIN}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => {
        const beforeItem4 = page.slices.filter((s) => s.key === "incidentDate" || s.key === "scenePlace");
        const afterItem4 = page.slices.filter((s) => s.key !== "incidentDate" && s.key !== "scenePlace");
        return (
          <Sheet key={`fr-${page.index}`} index={page.index}>
            {page.showPageNo ? (
              <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
                -{thaiNumeral(page.index + 1)}-
              </p>
            ) : null}

            {page.showHeader ? (
              <>
                <header
                  style={{
                    position: "relative",
                    minHeight: "18mm",
                    marginBottom: "2mm",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/smart-police/garuda.png"
                    alt=""
                    width={72}
                    height={82}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "16mm",
                      width: "auto",
                    }}
                  />
                  <h1
                    style={{
                      margin: 0,
                      paddingTop: "4mm",
                      fontSize: TITLE,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {FORENSIC_REQUEST_FORM_TITLE}
                  </h1>
                </header>
                <div style={{ flexShrink: 0 }}>
                  <Row>
                    <T>ส่วนราชการ</T>
                    <Dot
                      aria-label="ส่วนราชการ"
                      value={fields.agency}
                      onChange={(v) => onChange("agency", v)}
                      flex
                      minCh={10}
                    />
                    <T>โทร</T>
                    <Dot
                      aria-label="โทร"
                      value={fields.phone}
                      onChange={(v) => onChange("phone", v)}
                      minCh={12}
                    />
                  </Row>
                  <Row>
                    <T>ที่</T>
                    <Dot
                      aria-label="ที่"
                      value={fields.docNo}
                      onChange={(v) => onChange("docNo", v)}
                      flex
                      minCh={8}
                    />
                    <span style={{ flexShrink: 0 }}>/</span>
                    <T>ลง</T>
                    <Dot
                      aria-label="ลงวันที่"
                      value={fields.docDate}
                      onChange={(v) => onChange("docDate", v)}
                      flex
                      minCh={10}
                    />
                  </Row>
                  <Row>
                    <T>เรื่อง</T>
                    <Dot
                      aria-label="เรื่อง"
                      value={fields.subject}
                      onChange={(v) => onChange("subject", v)}
                      flex
                      minCh={12}
                    />
                  </Row>
                  <div
                    aria-hidden
                    style={{
                      borderTop: "2.25pt solid #111",
                      margin: "1.8mm 0 2.4mm",
                    }}
                  />
                  <Row>
                    <T>เรียน</T>
                    <Dot
                      aria-label="เรียน"
                      value={fields.toName}
                      onChange={(v) => onChange("toName", v)}
                      flex
                      minCh={12}
                    />
                  </Row>
                  <p
                    style={{
                      margin: "0.4mm 0 1mm 8mm",
                      fontSize: BODY,
                      lineHeight: LINE,
                      fontWeight: 700,
                    }}
                  >
                    {FORENSIC_REQUEST_INTRO}
                  </p>
                </div>
              </>
            ) : null}

            {page.showItem1 ? (
              <div style={{ flexShrink: 0 }}>
                <Row>
                  <T>(๑) เลขที่คดี</T>
                  <Dot
                    aria-label="เลขที่คดี"
                    value={fields.caseNo}
                    onChange={(v) => onChange("caseNo", v)}
                    flex
                    minCh={8}
                  />
                  <T>ชื่อผู้ต้องหา</T>
                  <Dot
                    aria-label="ชื่อผู้ต้องหา"
                    value={fields.suspectName}
                    onChange={(v) => onChange("suspectName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row style={{ paddingLeft: "8mm" }}>
                  <T>อายุ</T>
                  <Dot
                    aria-label="อายุผู้ต้องหา"
                    value={fields.suspectAge}
                    onChange={(v) => onChange("suspectAge", v)}
                    minCh={4}
                  />
                  <T>ปี</T>
                  <T>สัญชาติ</T>
                  <Dot
                    aria-label="สัญชาติผู้ต้องหา"
                    value={fields.suspectNationality}
                    onChange={(v) => onChange("suspectNationality", v)}
                    flex
                    minCh={8}
                  />
                </Row>
              </div>
            ) : null}

            {beforeItem4.map(renderSlice)}

            {page.showItem4 ? (
              <Row style={{ flexShrink: 0 }}>
                <T>(๔) ชื่อผู้กล่าวหา</T>
                <Dot
                  aria-label="ชื่อผู้กล่าวหา"
                  value={fields.complainantName}
                  onChange={(v) => onChange("complainantName", v)}
                  flex
                  minCh={8}
                />
                <T>อายุ</T>
                <Dot
                  aria-label="อายุผู้กล่าวหา"
                  value={fields.complainantAge}
                  onChange={(v) => onChange("complainantAge", v)}
                  minCh={4}
                />
                <T>ปี</T>
                <T>สัญชาติ</T>
                <Dot
                  aria-label="สัญชาติผู้กล่าวหา"
                  value={fields.complainantNationality}
                  onChange={(v) => onChange("complainantNationality", v)}
                  minCh={8}
                />
              </Row>
            ) : null}

            {afterItem4.map(renderSlice)}

            {page.showSigns ? (
              <div
                style={{
                  width: "62%",
                  marginLeft: "auto",
                  marginTop: "auto",
                  flexShrink: 0,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  columnGap: "1.5mm",
                  rowGap: "0.2mm",
                  alignItems: "baseline",
                }}
              >
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>(ลงชื่อ)</span>
                <Dot
                  aria-label="ลงชื่อพนักงานสอบสวน"
                  value={fields.signName}
                  onChange={(v) => onChange("signName", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE, whiteSpace: "nowrap" }}>
                  พนักงานสอบสวน
                </span>
                <span aria-hidden />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "baseline",
                    gap: "1.5mm",
                    minHeight: SIGN_LINE,
                    lineHeight: SIGN_LINE,
                    minWidth: 0,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>(</span>
                  <Dot
                    aria-label="ชื่อตัวบรรจงพนักงานสอบสวน"
                    value={fields.signPrinted}
                    onChange={(v) => onChange("signPrinted", v)}
                    flex
                    minCh={8}
                  />
                  <span style={{ flexShrink: 0 }}>)</span>
                </div>
                <span aria-hidden />
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>(ตำแหน่ง)</span>
                <Dot
                  aria-label="ตำแหน่งพนักงานสอบสวน"
                  value={fields.signPosition}
                  onChange={(v) => onChange("signPosition", v)}
                  flex
                  minCh={8}
                />
                <span aria-hidden />
              </div>
            ) : null}
          </Sheet>
        );
      })}
    </div>
  );
}
