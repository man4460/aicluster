"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { INQUIRY_REPORT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packInquiryReportPages,
  type InquiryReportFields,
  type InquiryReportPageBodySlice,
} from "@/lib/smart-police/form-templates/inquiry-report";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const TITLE = "15pt";
const LINE = "6.2mm";
const SIGN_LINE = "5.8mm";

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
        flexWrap: "wrap",
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

function Sheet({
  children,
  index,
  showLeftRule,
}: {
  children: ReactNode;
  index: number;
  showLeftRule?: boolean;
}) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: showLeftRule ? "12mm 16mm 12mm 36mm" : "12mm 16mm 12mm 22mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showLeftRule ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "28mm",
            top: "16mm",
            bottom: "16mm",
            borderLeft: "0.75pt solid #111",
          }}
        />
      ) : null}
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
  const indent = showLabel ? `calc(${label.length + 1}ch + 1.5mm)` : "0";
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
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
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

function CaseBetweenBrace({
  complainant,
  suspect,
  onComplainant,
  onSuspect,
}: {
  complainant: string;
  suspect: string;
  onComplainant: (v: string) => void;
  onSuspect: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto 1fr",
        alignItems: "stretch",
        columnGap: "2mm",
        margin: "2mm 0 2.5mm",
        height: "22mm",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <T>คดีระหว่าง</T>
      </div>
      <div aria-hidden style={{ width: "6mm", height: "100%" }}>
        <svg
          viewBox="0 0 24 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <path
            d="M20 1 C9 1 7 14 7 25 L7 40 C7 47 3 50 3 50 C3 50 7 53 7 60 L7 75 C7 86 9 99 20 99"
            fill="none"
            stroke="#111"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minWidth: 0,
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "2mm",
            width: "100%",
            lineHeight: LINE,
            fontSize: BODY,
          }}
        >
          <Dot aria-label="ผู้กล่าวหาในคดี" value={complainant} onChange={onComplainant} flex minCh={10} />
          <T>ผู้กล่าวหา</T>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "2mm",
            width: "100%",
            lineHeight: LINE,
            fontSize: BODY,
          }}
        >
          <Dot aria-label="ผู้ต้องหาในคดี" value={suspect} onChange={onSuspect} flex minCh={10} />
          <T>ผู้ต้องหา</T>
        </div>
      </div>
    </div>
  );
}

export function OfficialInquiryReportDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: InquiryReportFields;
  onChange: <K extends keyof InquiryReportFields>(key: K, value: InquiryReportFields[K]) => void;
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
      "width:168mm",
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

  const pages = useMemo(() => packInquiryReportPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchBody(sliceIndex: number, text: string, slices: InquiryReportPageBodySlice[]) {
    onChange("body", slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  const bodySlices = pages.flatMap((p) => (p.body ? [p.body] : []));

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`ir-${page.index}`} index={page.index} showLeftRule={page.showHeader}>
          {page.showHeader ? (
            <header style={{ textAlign: "center", marginBottom: "1.5mm", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smart-police/garuda.png"
                alt=""
                width={84}
                height={96}
                style={{ display: "block", margin: "0 auto 1mm", height: "24mm", width: "auto" }}
              />
              <p style={{ margin: 0, fontSize: "20pt", fontWeight: 700, lineHeight: 1.15 }}>
                สำนักงานตำรวจแห่งชาติ
              </p>
              <h1
                style={{
                  margin: "0.6mm 0 1.6mm",
                  fontSize: TITLE,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textDecoration: "underline",
                  textUnderlineOffset: "1mm",
                }}
              >
                {INQUIRY_REPORT_FORM_TITLE}
              </h1>
              <div style={{ textAlign: "left" }}>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>คดี</T>
                  <Dot
                    aria-label="คดี"
                    value={fields.caseNo}
                    onChange={(v) => onChange("caseNo", v)}
                    minCh={16}
                  />
                </Row>
                <Row>
                  <T>สถานีตำรวจ</T>
                  <Dot
                    aria-label="สถานีตำรวจ"
                    value={fields.station}
                    onChange={(v) => onChange("station", v)}
                    flex
                    minCh={8}
                  />
                  <T>เขต/อำเภอ</T>
                  <Dot
                    aria-label="เขตหรืออำเภอ"
                    value={fields.district}
                    onChange={(v) => onChange("district", v)}
                    flex
                    minCh={6}
                  />
                  <T>จังหวัด</T>
                  <Dot
                    aria-label="จังหวัด"
                    value={fields.province}
                    onChange={(v) => onChange("province", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    margin: "0 0 0.45mm",
                  }}
                >
                  <div style={{ gridColumn: "2 / 4" }}>
                    <Row style={{ flexWrap: "nowrap", marginBottom: 0 }}>
                      <T>วันที่</T>
                      <Dot
                        aria-label="วันที่"
                        value={fields.day}
                        onChange={(v) => onChange("day", v)}
                        flex
                        minCh={4}
                      />
                      <T>เดือน</T>
                      <Dot
                        aria-label="เดือน"
                        value={fields.month}
                        onChange={(v) => onChange("month", v)}
                        flex
                        minCh={6}
                      />
                      <T>พ.ศ.</T>
                      <Dot
                        aria-label="พ.ศ."
                        value={fields.year}
                        onChange={(v) => onChange("year", v)}
                        flex
                        minCh={5}
                      />
                    </Row>
                  </div>
                </div>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>เสนอ</T>
                  <Dot
                    aria-label="เสนอ"
                    value={fields.submitTo}
                    onChange={(v) => onChange("submitTo", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <CaseBetweenBrace
                  complainant={fields.complainant}
                  suspect={fields.suspect}
                  onComplainant={(v) => onChange("complainant", v)}
                  onSuspect={(v) => onChange("suspect", v)}
                />
                <FieldLines
                  label="ข้อหา"
                  value={fields.charge}
                  onChange={(v) => onChange("charge", v)}
                  lines={3}
                  showLabel
                  ariaLabel="ข้อหา"
                />
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>วันเวลาที่เกิดเหตุ</T>
                  <Dot
                    aria-label="วันเวลาที่เกิดเหตุ"
                    value={fields.incidentWhen}
                    onChange={(v) => onChange("incidentWhen", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ตำบลที่เกิดเหตุ</T>
                  <Dot
                    aria-label="ตำบลที่เกิดเหตุ"
                    value={fields.incidentPlace}
                    onChange={(v) => onChange("incidentPlace", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>วันเวลาที่ร้องทุกข์หรือกล่าวโทษ</T>
                  <Dot
                    aria-label="วันเวลาที่ร้องทุกข์หรือกล่าวโทษ"
                    value={fields.complaintWhen}
                    onChange={(v) => onChange("complaintWhen", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap", marginBottom: 0 }}>
                  <T>วันเวลาที่ผู้ต้องหาถูกควบคุมหรือขังและปล่อยตัวชั่วคราวหรือปล่อยชั่วคราว</T>
                  <T>ดังนี้คือ.-</T>
                </Row>
              </div>
            </header>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 2mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.showContHeader ? (
            <header style={{ textAlign: "center", marginBottom: "2mm", flexShrink: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: TITLE,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textDecoration: "underline",
                  textUnderlineOffset: "1mm",
                }}
              >
                ข้อเท็จจริงและความเห็น
              </h1>
              <p
                style={{
                  margin: "1mm auto 0",
                  maxWidth: "168mm",
                  fontSize: "11pt",
                  lineHeight: 1.35,
                  fontWeight: 400,
                }}
              >
                (ข้อเท็จจริงนั้นให้กล่าวถึงคำให้การของผู้กล่าวหา ผู้ต้องหา หลักฐานพยานทุกปาก ส่วนความเห็นนั้น
                ให้อ้างเหตุผลบทกฎหมาย และมาตราประกอบด้วย)
              </p>
            </header>
          ) : null}

          {page.body ? (
            <FieldLines
              label={page.body.label}
              value={page.body.text}
              onChange={(v) => patchBody(page.body!.sliceIndex, v, bodySlices)}
              lines={page.body.lines}
              showLabel={page.body.showLabel}
              ariaLabel={page.body.showLabel ? "ข้อเท็จจริงและความเห็น" : "ข้อเท็จจริงและความเห็น (ต่อ)"}
            />
          ) : null}

          {page.showClosing ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                margin: "1.2mm 0 0.6mm",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  gridColumn: "2 / 4",
                  margin: 0,
                  textAlign: "left",
                  fontSize: BODY,
                  lineHeight: LINE,
                }}
              >
                จึงเสนอสำนวนการสอบสวน และความเห็นมาเพื่อโปรดพิจารณา
              </p>
            </div>
          ) : null}

          {page.showSigns ? (
            <div
              style={{
                width: "62%",
                marginLeft: "auto",
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                columnGap: "1.5mm",
                rowGap: "0.15mm",
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
                  aria-label="ชื่อพนักงานสอบสวน"
                  value={fields.signPrinted}
                  onChange={(v) => onChange("signPrinted", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>)</span>
              </div>
              <span aria-hidden />
            </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
