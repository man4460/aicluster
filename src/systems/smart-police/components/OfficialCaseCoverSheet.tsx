"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CASE_COVER_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packCaseCoverPages,
  type CaseCoverFields,
  type CaseCoverFlowFieldKey,
  type CaseCoverPageBodySlice,
} from "@/lib/smart-police/form-templates/case-cover";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
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
        padding: "12mm 16mm 12mm",
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

function ApptBlock({
  n,
  date,
  witness,
  investigator,
  onDate,
  onWitness,
  onInvestigator,
}: {
  n: number;
  date: string;
  witness: string;
  investigator: string;
  onDate: (v: string) => void;
  onWitness: (v: string) => void;
  onInvestigator: (v: string) => void;
}) {
  const label = n === 1 ? "ครั้งที่หนึ่ง" : n === 2 ? "ครั้งที่สอง" : "ครั้งที่สาม";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        columnGap: "4mm",
        marginBottom: "0.8mm",
      }}
    >
      <div>
        <Row style={{ flexWrap: "nowrap", marginBottom: "0.2mm" }}>
          <T>{label}</T>
          <T>วันที่</T>
          <Dot aria-label={`${label} วันที่`} value={date} onChange={onDate} flex minCh={6} />
        </Row>
        <div
          aria-hidden
          style={{
            height: LINE,
            borderBottom: "0.5pt dotted #111",
            boxSizing: "border-box",
            marginLeft: "calc(16ch + 3mm)",
          }}
        />
      </div>
      <div>
        <Row style={{ flexWrap: "nowrap", marginBottom: "0.2mm" }}>
          <T>ชื่อพยาน</T>
          <Dot aria-label={`${label} ชื่อพยาน`} value={witness} onChange={onWitness} flex minCh={6} />
        </Row>
        <Row style={{ flexWrap: "nowrap", marginBottom: 0 }}>
          <T>ชื่อผู้สอบสวน</T>
          <Dot
            aria-label={`${label} ชื่อผู้สอบสวน`}
            value={investigator}
            onChange={onInvestigator}
            flex
            minCh={6}
          />
        </Row>
      </div>
    </div>
  );
}

export function OfficialCaseCoverDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: CaseCoverFields;
  onChange: <K extends keyof CaseCoverFields>(key: K, value: CaseCoverFields[K]) => void;
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

  const pages = useMemo(() => packCaseCoverPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: CaseCoverFlowFieldKey, sliceIndex: number, text: string, slices: CaseCoverPageBodySlice[]) {
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  const partySlices = pages.flatMap((p) => p.parties);
  const witnessSlices = pages.flatMap((p) => p.witnesses);
  const noteSlices = pages.flatMap((p) => (p.notes ? [p.notes] : []));

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`cc-${page.index}`} index={page.index}>
          {page.showHeader ? (
            <header style={{ textAlign: "center", marginBottom: "2mm", flexShrink: 0 }}>
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
              <div style={{ marginTop: "2mm", textAlign: "left" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    columnGap: "3mm",
                    alignItems: "baseline",
                  }}
                >
                  <Row style={{ flexWrap: "nowrap", marginBottom: 0 }}>
                    <T>คดีที่</T>
                    <Dot
                      aria-label="คดีที่"
                      value={fields.caseNo}
                      onChange={(v) => onChange("caseNo", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: TITLE,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textDecoration: "underline",
                      textUnderlineOffset: "1mm",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {CASE_COVER_FORM_TITLE}
                  </h1>
                  <span aria-hidden />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4mm" }}>
                  <Row style={{ flexWrap: "nowrap", width: "48%", marginBottom: 0 }}>
                    <T>ที่ทำการสอบสวน</T>
                    <Dot
                      aria-label="ที่ทำการสอบสวน"
                      value={fields.station}
                      onChange={(v) => onChange("station", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                </div>
              </div>
            </header>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 5mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.parties.map((slice) => (
            <FieldLines
              key={`${slice.key}-${slice.sliceIndex}`}
              label={slice.label}
              value={slice.text}
              onChange={(v) =>
                patchFlow(
                  slice.key,
                  slice.sliceIndex,
                  v,
                  partySlices.filter((s) => s.key === slice.key),
                )
              }
              lines={slice.lines}
              showLabel={slice.showLabel}
              ariaLabel={slice.showLabel ? slice.label : `${slice.label} (ต่อ)`}
            />
          ))}

          {page.showMetaControl ? (
            <div style={{ flexShrink: 0, marginTop: "0.6mm" }}>
              <Row>
                <T>รับแจ้งเหตุวันที่</T>
                <Dot
                  aria-label="รับแจ้งเหตุวันที่"
                  value={fields.reportDate}
                  onChange={(v) => onChange("reportDate", v)}
                  flex
                  minCh={8}
                />
                <T>ของกลางตามบัญชีของกลางลำดับที่</T>
                <Dot
                  aria-label="บัญชีของกลางลำดับที่"
                  value={fields.exhibitNo}
                  onChange={(v) => onChange("exhibitNo", v)}
                  flex
                  minCh={6}
                />
              </Row>
              <Row style={{ flexWrap: "nowrap" }}>
                <T>เจ้าของสำนวน</T>
                <Dot
                  aria-label="เจ้าของสำนวน"
                  value={fields.investigator}
                  onChange={(v) => onChange("investigator", v)}
                  flex
                  minCh={10}
                />
              </Row>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  alignItems: "start",
                  margin: "0.6mm 0 1mm",
                }}
              >
                <T>การควบคุมผู้ต้องหา</T>
                <div style={{ gridColumn: "2 / 4" }}>
                  <Row style={{ flexWrap: "nowrap" }}>
                    <span style={{ flexShrink: 0 }}>(๑) ปล่อยชั่วคราวแต่วันที่</span>
                    <Dot
                      aria-label="ปล่อยชั่วคราวแต่วันที่"
                      value={fields.bailFrom}
                      onChange={(v) => onChange("bailFrom", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <Row style={{ flexWrap: "nowrap" }}>
                    <span style={{ flexShrink: 0 }}>(๒) ควบคุมแต่วันที่</span>
                    <Dot
                      aria-label="ควบคุมแต่วันที่"
                      value={fields.custodyFrom}
                      onChange={(v) => onChange("custodyFrom", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <Row style={{ flexWrap: "nowrap", paddingLeft: "7.5mm" }}>
                    <span style={{ flexShrink: 0 }}>ครบวันที่</span>
                    <Dot
                      aria-label="ควบคุมครบวันที่"
                      value={fields.custodyUntil}
                      onChange={(v) => onChange("custodyUntil", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <Row style={{ flexWrap: "nowrap" }}>
                    <span style={{ flexShrink: 0 }}>(๓) ศาลสั่งขังแต่วันที่</span>
                    <Dot
                      aria-label="ศาลสั่งขังแต่วันที่"
                      value={fields.courtFrom}
                      onChange={(v) => onChange("courtFrom", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <Row style={{ flexWrap: "nowrap", paddingLeft: "7.5mm" }}>
                    <span style={{ flexShrink: 0 }}>ครบวันที่</span>
                    <Dot
                      aria-label="ขังครบวันที่"
                      value={fields.courtUntil}
                      onChange={(v) => onChange("courtUntil", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                </div>
              </div>
            </div>
          ) : null}

          {page.witnesses.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: page.showWitnessLead ? "auto 1fr" : "1fr",
                columnGap: "2mm",
                alignItems: "start",
                flexShrink: 0,
              }}
            >
              {page.showWitnessLead ? <T>พยานที่อ้าง</T> : null}
              <div>
                {page.witnesses.map((slice) => (
                  <FieldLines
                    key={`${slice.key}-${slice.sliceIndex}`}
                    label={slice.label}
                    value={slice.text}
                    onChange={(v) =>
                      patchFlow(
                        slice.key,
                        slice.sliceIndex,
                        v,
                        witnessSlices.filter((s) => s.key === slice.key),
                      )
                    }
                    lines={slice.lines}
                    showLabel={slice.showLabel}
                    ariaLabel={slice.showLabel ? `พยานที่อ้าง ${slice.label}` : `พยานที่อ้าง ${slice.label} (ต่อ)`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {page.showApptSend ? (
            <div style={{ flexShrink: 0, marginTop: "1.2mm" }}>
              <p
                style={{
                  margin: "0 0 1.2mm",
                  textAlign: "center",
                  fontSize: BODY,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: "1mm",
                }}
              >
                วันที่นัดสอบสวน
              </p>
              <ApptBlock
                n={1}
                date={fields.appt1Date}
                witness={fields.appt1Witness}
                investigator={fields.appt1Investigator}
                onDate={(v) => onChange("appt1Date", v)}
                onWitness={(v) => onChange("appt1Witness", v)}
                onInvestigator={(v) => onChange("appt1Investigator", v)}
              />
              <ApptBlock
                n={2}
                date={fields.appt2Date}
                witness={fields.appt2Witness}
                investigator={fields.appt2Investigator}
                onDate={(v) => onChange("appt2Date", v)}
                onWitness={(v) => onChange("appt2Witness", v)}
                onInvestigator={(v) => onChange("appt2Investigator", v)}
              />
              <ApptBlock
                n={3}
                date={fields.appt3Date}
                witness={fields.appt3Witness}
                investigator={fields.appt3Investigator}
                onDate={(v) => onChange("appt3Date", v)}
                onWitness={(v) => onChange("appt3Witness", v)}
                onInvestigator={(v) => onChange("appt3Investigator", v)}
              />
              <Row style={{ marginTop: "0.8mm" }}>
                <T>ส่งสำนวนไปยัง</T>
                <Dot
                  aria-label="ส่งสำนวนไปยัง"
                  value={fields.sentTo}
                  onChange={(v) => onChange("sentTo", v)}
                  flex
                  minCh={8}
                />
                <T>โดยรายงานการสอบสวนที่</T>
                <Dot
                  aria-label="รายงานการสอบสวนที่"
                  value={fields.reportNo}
                  onChange={(v) => onChange("reportNo", v)}
                  flex
                  minCh={6}
                />
                <T>ลงวันที่</T>
                <Dot
                  aria-label="ลงวันที่ส่งสำนวน"
                  value={fields.sentDate}
                  onChange={(v) => onChange("sentDate", v)}
                  flex
                  minCh={6}
                />
              </Row>
            </div>
          ) : null}

          {page.notes ? (
            <FieldLines
              label={page.notes.label}
              value={page.notes.text}
              onChange={(v) => patchFlow("notes", page.notes!.sliceIndex, v, noteSlices)}
              lines={page.notes.lines}
              showLabel={page.notes.showLabel}
              ariaLabel={page.notes.showLabel ? "หมายเหตุ" : "หมายเหตุ (ต่อ)"}
            />
          ) : null}

          {page.index === pages.length - 1 ? (
            <div
              aria-hidden
              style={{
                marginTop: "auto",
                borderTop: "0.75pt solid #111",
                flexShrink: 0,
              }}
            />
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
