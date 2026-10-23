"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CASE_PROGRESS_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packCaseProgressPages,
  type CaseProgressFields,
  type CaseProgressFlowFieldKey,
  type CaseProgressPageSlice,
} from "@/lib/smart-police/form-templates/case-progress";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "18pt";
const LINE = "7.2mm";

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
        padding: "14mm 16mm 14mm",
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

export function OfficialCaseProgressDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: CaseProgressFields;
  onChange: <K extends keyof CaseProgressFields>(key: K, value: CaseProgressFields[K]) => void;
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

  const pages = useMemo(() => packCaseProgressPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: CaseProgressFlowFieldKey, sliceIndex: number, text: string) {
    const slices: CaseProgressPageSlice[] = [];
    for (const p of pages) {
      slices.push(...p.charge.filter((b) => b.key === key));
      slices.push(...p.body.filter((b) => b.key === key));
    }
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`cp-${page.index}`} index={page.index}>
          {page.showPageNo ? (
            <p style={{ margin: "0 0 2mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              -{thaiNumeral(page.index + 1)}-
            </p>
          ) : null}

          {page.showHeader ? (
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
                  {CASE_PROGRESS_FORM_TITLE}
                </h1>
              </header>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  columnGap: "1.5mm",
                  width: "100%",
                  marginBottom: "2mm",
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
                  <T>ที่</T>
                  <Dot
                    aria-label="ที่"
                    value={fields.docNo}
                    onChange={(v) => onChange("docNo", v)}
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
                    <T>สถานที่</T>
                    <Dot
                      aria-label="สถานที่"
                      value={fields.place}
                      onChange={(v) => onChange("place", v)}
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
              <Row style={{ flexWrap: "nowrap", marginBottom: "1.2mm" }}>
                <T>เรียน</T>
                <Dot
                  aria-label="เรียน"
                  value={fields.toName}
                  onChange={(v) => onChange("toName", v)}
                  flex
                  minCh={10}
                />
              </Row>
            </>
          ) : null}

          {page.charge.map((slice) => (
            <FieldLines
              key={`ch-${slice.key}-${slice.sliceIndex}`}
              label={slice.label}
              value={slice.text}
              onChange={(v) => patchFlow(slice.key, slice.sliceIndex, v)}
              lines={slice.lines}
              showLabel={slice.showLabel}
              ariaLabel={slice.showLabel ? slice.label : `${slice.label} (ต่อ)`}
            />
          ))}

          {page.showMid ? (
            <div style={{ flexShrink: 0, marginTop: "0.6mm" }}>
              <Row>
                <T>คดีที่</T>
                <Dot
                  aria-label="คดีที่"
                  value={fields.caseNo}
                  onChange={(v) => onChange("caseNo", v)}
                  flex
                  minCh={6}
                />
                <T>ป.จ.ว.ข้อ</T>
                <Dot
                  aria-label="ป.จ.ว.ข้อ"
                  value={fields.dailyLog}
                  onChange={(v) => onChange("dailyLog", v)}
                  flex
                  minCh={4}
                />
              </Row>
              <Row style={{ flexWrap: "nowrap" }}>
                <T>ลงวันที่</T>
                <Dot
                  aria-label="ลงวันที่คำร้องทุกข์"
                  value={fields.complaintDate}
                  onChange={(v) => onChange("complaintDate", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>
                  และพนักงานสอบสวนได้รับคำร้องทุกข์หรือกล่าวโทษไว้แล้วนั้น
                </span>
              </Row>
              <p
                style={{
                  margin: "1.2mm 0 1.4mm",
                  fontSize: BODY,
                  lineHeight: LINE,
                  fontWeight: 700,
                }}
              >
                ขอแจ้งความคืบหน้าผลการดำเนินการของพนักงานสอบสวนให้ทราบ ดังนี้
              </p>
            </div>
          ) : null}

          {page.body.map((slice) => (
            <FieldLines
              key={`bd-${slice.key}-${slice.sliceIndex}`}
              label={slice.label}
              value={slice.text}
              onChange={(v) => patchFlow(slice.key, slice.sliceIndex, v)}
              lines={slice.lines}
              showLabel={slice.showLabel}
              ariaLabel={slice.showLabel ? slice.label : `${slice.label} (ต่อ)`}
            />
          ))}

          {page.showClose ? (
            <div
              style={{
                width: "62%",
                marginLeft: "auto",
                flexShrink: 0,
                marginTop: "3mm",
              }}
            >
              <p
                style={{
                  margin: "0 0 3mm",
                  textAlign: "center",
                  fontSize: BODY,
                  lineHeight: LINE,
                  fontWeight: 700,
                }}
              >
                ขอแสดงความนับถือ
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  columnGap: "1.5mm",
                  alignItems: "baseline",
                  minHeight: LINE,
                  lineHeight: LINE,
                  marginBottom: "0.8mm",
                }}
              >
                <span style={{ flexShrink: 0 }}>(ลงชื่อ</span>
                <Dot
                  aria-label="ลงชื่อ"
                  value={fields.signName}
                  onChange={(v) => onChange("signName", v)}
                  flex
                  minCh={10}
                />
                <span style={{ flexShrink: 0 }}>)</span>
              </div>
              <Row style={{ flexWrap: "nowrap" }}>
                <T>ตำแหน่ง</T>
                <Dot
                  aria-label="ตำแหน่ง"
                  value={fields.signPosition}
                  onChange={(v) => onChange("signPosition", v)}
                  flex
                  minCh={10}
                />
              </Row>
            </div>
          ) : null}

          {page.showNotes ? (
            <div style={{ flexShrink: 0, marginTop: "3mm", fontSize: BODY, lineHeight: LINE }}>
              <p style={{ margin: "0 0 0.8mm", fontWeight: 700 }}>หมายเหตุ.-</p>
              <p style={{ margin: "0 0 1.4mm", textAlign: "justify", lineHeight: 1.45 }}>
                หากท่านประสงค์จะแจ้งข้อมูลข่าวสารที่เป็นประโยชน์ต่อการสอบสวนเพิ่มเติมหรือมีข้อสงสัย
                เกี่ยวกับผลการดำเนินการตามที่แจ้งข้างต้น ท่านสามารถติดต่อกับ
              </p>
              <Row>
                <T>๑.ยศ</T>
                <Dot
                  aria-label="ยศพนักงานสอบสวนเจ้าของสำนวน"
                  value={fields.contact1Rank}
                  onChange={(v) => onChange("contact1Rank", v)}
                  minCh={8}
                />
                <T>ชื่อ-นามสกุล</T>
                <Dot
                  aria-label="ชื่อ-นามสกุลพนักงานสอบสวนเจ้าของสำนวน"
                  value={fields.contact1Name}
                  onChange={(v) => onChange("contact1Name", v)}
                  flex
                  minCh={10}
                />
              </Row>
              <Row>
                <T>ตำแหน่ง</T>
                <Dot
                  aria-label="ตำแหน่งพนักงานสอบสวนเจ้าของสำนวน"
                  value={fields.contact1Position}
                  onChange={(v) => onChange("contact1Position", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>(พนักงานสอบสวนเจ้าของสำนวน)</span>
              </Row>
              <Row>
                <T>หมายเลขโทรศัพท์ที่ทำงาน</T>
                <Dot
                  aria-label="โทรศัพท์ที่ทำงานพนักงานสอบสวน"
                  value={fields.contact1Phone}
                  onChange={(v) => onChange("contact1Phone", v)}
                  flex
                  minCh={8}
                />
                <T>มือถือ</T>
                <Dot
                  aria-label="มือถือพนักงานสอบสวน"
                  value={fields.contact1Mobile}
                  onChange={(v) => onChange("contact1Mobile", v)}
                  flex
                  minCh={8}
                />
              </Row>
              <Row>
                <T>๒.ยศ</T>
                <Dot
                  aria-label="ยศผู้บังคับบัญชาพนักงานสอบสวน"
                  value={fields.contact2Rank}
                  onChange={(v) => onChange("contact2Rank", v)}
                  minCh={8}
                />
                <T>ชื่อ-นามสกุล</T>
                <Dot
                  aria-label="ชื่อ-นามสกุลผู้บังคับบัญชาพนักงานสอบสวน"
                  value={fields.contact2Name}
                  onChange={(v) => onChange("contact2Name", v)}
                  flex
                  minCh={10}
                />
              </Row>
              <Row>
                <T>ตำแหน่ง</T>
                <Dot
                  aria-label="ตำแหน่งผู้บังคับบัญชาพนักงานสอบสวน"
                  value={fields.contact2Position}
                  onChange={(v) => onChange("contact2Position", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>(ผู้บังคับบัญชาพนักงานสอบสวนเจ้าของสำนวน)</span>
              </Row>
              <Row>
                <T>หมายเลขโทรศัพท์ที่ทำงาน</T>
                <Dot
                  aria-label="โทรศัพท์ที่ทำงานผู้บังคับบัญชา"
                  value={fields.contact2Phone}
                  onChange={(v) => onChange("contact2Phone", v)}
                  flex
                  minCh={8}
                />
                <T>มือถือ</T>
                <Dot
                  aria-label="มือถือผู้บังคับบัญชา"
                  value={fields.contact2Mobile}
                  onChange={(v) => onChange("contact2Mobile", v)}
                  flex
                  minCh={8}
                />
              </Row>
            </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
