"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  INJURY_REFERRAL_FORM_TITLE,
  INJURY_REFERRAL_FORM_TITLE_P2,
} from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packInjuryReferralPages,
  type InjuryReferralFields,
  type InjuryReferralFlowKey,
  type InjuryReferralPageSlice,
} from "@/lib/smart-police/form-templates/injury-referral";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
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
  value,
  onChange,
  lines,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
}) {
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

export function OfficialInjuryReferralDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: InjuryReferralFields;
  onChange: <K extends keyof InjuryReferralFields>(key: K, value: InjuryReferralFields[K]) => void;
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

  const pages = useMemo(() => packInjuryReferralPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: InjuryReferralFlowKey, sliceIndex: number, text: string) {
    const slices: InjuryReferralPageSlice[] = [];
    for (const p of pages) slices.push(...p.slices.filter((s) => s.key === key));
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`ir-${page.index}`} index={page.index}>
          {page.showPageNo ? (
            <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              -{thaiNumeral(page.index + 1)}-
            </p>
          ) : null}

          {page.showHeader && page.kind === "referral" ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "2.5mm", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/smart-police/garuda.png"
                  alt=""
                  width={84}
                  height={96}
                  style={{ display: "block", margin: "0 auto 1.5mm", height: "20mm", width: "auto" }}
                />
                <h1
                  style={{
                    margin: 0,
                    fontSize: TITLE,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {INJURY_REFERRAL_FORM_TITLE}
                </h1>
              </header>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  columnGap: "1.5mm",
                  width: "100%",
                  marginBottom: "1.2mm",
                  fontSize: BODY,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "baseline",
                    gap: "1.5mm",
                    minHeight: LINE,
                    lineHeight: LINE,
                  }}
                >
                  <T>คดีที่</T>
                  <Dot
                    aria-label="คดีที่"
                    value={fields.caseNo}
                    onChange={(v) => onChange("caseNo", v)}
                    flex
                    minCh={6}
                  />
                </div>
                <div />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45mm" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      alignItems: "baseline",
                      gap: "1.5mm",
                      minHeight: LINE,
                      lineHeight: LINE,
                    }}
                  >
                    <T>สถานีตำรวจ</T>
                    <Dot
                      aria-label="สถานีตำรวจ"
                      value={fields.station}
                      onChange={(v) => onChange("station", v)}
                      flex
                      minCh={8}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      alignItems: "baseline",
                      gap: "1.5mm",
                      minHeight: LINE,
                      lineHeight: LINE,
                    }}
                  >
                    <T>วันที่</T>
                    <Dot aria-label="วันที่" value={fields.day} onChange={(v) => onChange("day", v)} flex minCh={3} />
                    <T>เดือน</T>
                    <Dot aria-label="เดือน" value={fields.month} onChange={(v) => onChange("month", v)} flex minCh={4} />
                    <T>พ.ศ.</T>
                    <Dot aria-label="พ.ศ." value={fields.year} onChange={(v) => onChange("year", v)} flex minCh={4} />
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <Row>
                  <T>เลขที่</T>
                  <Dot
                    aria-label="เลขที่"
                    value={fields.docNo}
                    onChange={(v) => onChange("docNo", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <T>ชื่อผู้บาดเจ็บหรือศพ</T>
                  <Dot
                    aria-label="ชื่อผู้บาดเจ็บหรือศพ"
                    value={fields.injuryName}
                    onChange={(v) => onChange("injuryName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>วันเวลาที่เกิดเหตุ</T>
                  <Dot
                    aria-label="วันเวลาที่เกิดเหตุ"
                    value={fields.incidentWhen}
                    onChange={(v) => onChange("incidentWhen", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>วันเวลาส่งผู้บาดเจ็บหรือศพ</T>
                  <Dot
                    aria-label="วันเวลาส่งผู้บาดเจ็บหรือศพ"
                    value={fields.sentWhen}
                    onChange={(v) => onChange("sentWhen", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>ชื่อผู้นำส่ง</T>
                  <Dot
                    aria-label="ชื่อผู้นำส่ง"
                    value={fields.senderName}
                    onChange={(v) => onChange("senderName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
              </div>
            </>
          ) : null}

          {page.showHeader && page.kind === "doctor" ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "3.5mm", flexShrink: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: TITLE,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {INJURY_REFERRAL_FORM_TITLE_P2}
                </h1>
              </header>
              <div style={{ flexShrink: 0 }}>
                <Row>
                  <T>เลขที่</T>
                  <Dot
                    aria-label="เลขที่ใบนำส่ง"
                    value={fields.docNo}
                    onChange={(v) => onChange("docNo", v)}
                    flex
                    minCh={6}
                  />
                  <T>ตำบลที่แพทย์ตรวจ</T>
                  <Dot
                    aria-label="ตำบลที่แพทย์ตรวจ"
                    value={fields.doctorTambon}
                    onChange={(v) => onChange("doctorTambon", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <T>ชื่อผู้บาดเจ็บหรือศพ</T>
                  <Dot
                    aria-label="ชื่อผู้บาดเจ็บหรือศพ หน้าแพทย์"
                    value={fields.injuryName}
                    onChange={(v) => onChange("injuryName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>สถานีตำรวจที่นำส่ง</T>
                  <Dot
                    aria-label="สถานีตำรวจที่นำส่ง"
                    value={fields.station}
                    onChange={(v) => onChange("station", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>รับไว้วันที่</T>
                  <Dot
                    aria-label="รับไว้วันที่"
                    value={fields.receivedDay}
                    onChange={(v) => onChange("receivedDay", v)}
                    flex
                    minCh={3}
                  />
                  <T>เดือน</T>
                  <Dot
                    aria-label="รับไว้เดือน"
                    value={fields.receivedMonth}
                    onChange={(v) => onChange("receivedMonth", v)}
                    flex
                    minCh={4}
                  />
                  <T>พ.ศ.</T>
                  <Dot
                    aria-label="รับไว้พ.ศ."
                    value={fields.receivedYear}
                    onChange={(v) => onChange("receivedYear", v)}
                    flex
                    minCh={4}
                  />
                  <T>เวลา</T>
                  <Dot
                    aria-label="รับไว้เวลา"
                    value={fields.receivedTime}
                    onChange={(v) => onChange("receivedTime", v)}
                    flex
                    minCh={4}
                  />
                  <span style={{ flexShrink: 0 }}>น.</span>
                </Row>
              </div>
            </>
          ) : null}

          {page.slices.map((slice) => (
            <div key={`${slice.key}-${slice.sliceIndex}`} style={{ flexShrink: 0 }}>
              {slice.showHeading ? (
                <p
                  style={{
                    margin: "1.2mm 0 0.4mm",
                    fontSize: BODY,
                    lineHeight: LINE,
                    fontWeight: 700,
                    textAlign: slice.key === "findings" ? "center" : "left",
                  }}
                >
                  {slice.label}
                </p>
              ) : null}
              <FieldLines
                value={slice.text}
                onChange={(v) => patchFlow(slice.key, slice.sliceIndex, v)}
                lines={slice.lines}
                ariaLabel={slice.showHeading ? slice.label : `${slice.label} (ต่อ)`}
              />
            </div>
          ))}

          {page.showSigns && page.kind === "referral" ? (
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
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>
                พนักงานสอบสวน / บันทึก
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

          {page.showSigns && page.kind === "doctor" ? (
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
                aria-label="ลงชื่อนายแพทย์ผู้ตรวจ"
                value={fields.doctorSignName}
                onChange={(v) => onChange("doctorSignName", v)}
                flex
                minCh={8}
              />
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE, whiteSpace: "nowrap" }}>
                นายแพทย์ผู้ตรวจ
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
                  aria-label="ชื่อตัวบรรจงนายแพทย์ผู้ตรวจ"
                  value={fields.doctorSignPrinted}
                  onChange={(v) => onChange("doctorSignPrinted", v)}
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
