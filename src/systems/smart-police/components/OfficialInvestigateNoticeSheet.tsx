"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { INVESTIGATE_NOTICE_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  INVESTIGATE_NOTICE_CLOSE,
  packInvestigateNoticePages,
  type InvestigateNoticeFields,
  type InvestigateNoticeFlowKey,
  type InvestigateNoticePageSlice,
} from "@/lib/smart-police/form-templates/investigate-notice";
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
  showLabel?: boolean;
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

export function OfficialInvestigateNoticeDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: InvestigateNoticeFields;
  onChange: <K extends keyof InvestigateNoticeFields>(key: K, value: InvestigateNoticeFields[K]) => void;
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

  const pages = useMemo(() => packInvestigateNoticePages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: InvestigateNoticeFlowKey, sliceIndex: number, text: string) {
    const slices: InvestigateNoticePageSlice[] = [];
    for (const p of pages) {
      slices.push(
        ...p.incidentNotes.filter((b) => b.key === key),
        ...p.scene.filter((b) => b.key === key),
        ...p.charge.filter((b) => b.key === key),
      );
    }
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`inv-${page.index}`} index={page.index}>
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
                  {INVESTIGATE_NOTICE_FORM_TITLE}
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
                  <T>โทร.</T>
                  <Dot aria-label="โทร" value={fields.phone} onChange={(v) => onChange("phone", v)} minCh={12} />
                </Row>
                <Row>
                  <T>ที่</T>
                  <Dot aria-label="ที่" value={fields.docNo} onChange={(v) => onChange("docNo", v)} flex minCh={8} />
                  <span style={{ flexShrink: 0 }}>/</span>
                  <T>วันที่</T>
                  <Dot
                    aria-label="วันที่หนังสือ"
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
                  <Dot aria-label="เรียน" value={fields.toName} onChange={(v) => onChange("toName", v)} flex minCh={12} />
                </Row>
              </div>
            </>
          ) : null}

          {page.showWhen ? (
            <Row style={{ flexShrink: 0, paddingLeft: "12mm", marginTop: "4mm" }}>
              <T>ด้วยเมื่อวันที่</T>
              <Dot
                aria-label="ด้วยเมื่อวันที่"
                value={fields.whenDate}
                onChange={(v) => onChange("whenDate", v)}
                flex
                minCh={10}
              />
              <T>ผู้ต้องหา</T>
            </Row>
          ) : null}

          {page.incidentNotes.map((slice) => (
            <FieldLines
              key={`n-${slice.sliceIndex}`}
              label={slice.label}
              showLabel={slice.showLabel}
              value={slice.text}
              lines={slice.lines}
              ariaLabel="รายละเอียดเหตุและผู้ต้องหา"
              onChange={(v) => patchFlow("incidentNotes", slice.sliceIndex, v)}
            />
          ))}

          {page.scene.map((slice) => (
            <FieldLines
              key={`sc-${slice.sliceIndex}`}
              label={slice.label}
              showLabel={slice.showLabel}
              value={slice.text}
              lines={slice.lines}
              ariaLabel="เหตุเกิด"
              onChange={(v) => patchFlow("scene", slice.sliceIndex, v)}
            />
          ))}

          {page.showCase ? (
            <>
              <Row style={{ flexWrap: "wrap", flexShrink: 0 }}>
                <T>พนักงานสอบสวนได้รับคำร้องทุกข์ไว้เป็นคดีอาญาที่</T>
                <Dot
                  aria-label="คดีอาญาที่"
                  value={fields.caseNo}
                  onChange={(v) => onChange("caseNo", v)}
                  flex
                  minCh={8}
                />
                <T>ลงวันที่</T>
                <Dot
                  aria-label="ลงวันที่รับคำร้อง"
                  value={fields.complaintDate}
                  onChange={(v) => onChange("complaintDate", v)}
                  minCh={8}
                />
              </Row>
              <Row style={{ flexWrap: "wrap", flexShrink: 0 }}>
                <T>ปจว.ข้อ</T>
                <Dot aria-label="ปจว.ข้อ" value={fields.pjwItem} onChange={(v) => onChange("pjwItem", v)} minCh={6} />
                <T>เวลา</T>
                <Dot aria-label="เวลา" value={fields.time} onChange={(v) => onChange("time", v)} minCh={6} />
                <T>น.</T>
              </Row>
            </>
          ) : null}

          {page.charge.map((slice) => (
            <FieldLines
              key={`ch-${slice.sliceIndex}`}
              label={slice.label}
              showLabel={slice.showLabel}
              value={slice.text}
              lines={slice.lines}
              ariaLabel="โดยกล่าวหาว่า"
              onChange={(v) => patchFlow("charge", slice.sliceIndex, v)}
            />
          ))}

          {page.showClose ? (
            <p style={{ margin: "1.2mm 0 2mm", textAlign: "justify", flexShrink: 0 }}>{INVESTIGATE_NOTICE_CLOSE}</p>
          ) : null}

          {page.showSigns ? (
            <div
              style={{
                width: "62%",
                marginLeft: "auto",
                marginTop: "6mm",
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                columnGap: "1.5mm",
                rowGap: "0.2mm",
                alignItems: "baseline",
              }}
            >
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ลงชื่อ</span>
              <Dot
                aria-label="ลงชื่อพนักงานสอบสวน"
                value={fields.signName}
                onChange={(v) => onChange("signName", v)}
                flex
                minCh={8}
              />
              <span aria-hidden />
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
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ตำแหน่ง</span>
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
      ))}
    </div>
  );
}
