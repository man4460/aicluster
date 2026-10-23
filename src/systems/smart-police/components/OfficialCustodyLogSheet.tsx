"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CUSTODY_LOG_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  CUSTODY_LOG_NOTE_1,
  CUSTODY_LOG_NOTE_2,
  defaultCustodyLogCounters,
  packCustodyLogPages,
  type CustodyLogFields,
  type CustodyLogLineCounters,
  type CustodyLogPageModel,
} from "@/lib/smart-police/form-templates/custody-log";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "18pt";
const LINE = "7.2mm";
const DOT_LINE = "7.2mm";
const RULE = "0.75pt solid #111";
const COL_DATE = "32mm";
const COL_SIGN = "40mm";
const HEAD_H = "14mm";

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
        minHeight: DOT_LINE,
        margin: "0 0 0.45mm",
        lineHeight: DOT_LINE,
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

function CaseBrace() {
  return (
    <div aria-hidden style={{ width: "4.2mm", height: "100%" }}>
      <svg viewBox="0 0 24 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path
          d="M20 1 C9 1 7 14 7 25 L7 40 C7 47 3 50 3 50 C3 50 7 53 7 60 L7 75 C7 86 9 99 20 99"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Th({ children, borderRight }: { children: ReactNode; borderRight?: boolean }) {
  return (
    <div
      style={{
        borderRight: borderRight ? RULE : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontWeight: 700,
        fontSize: BODY,
        lineHeight: 1.25,
        padding: "0 1mm",
      }}
    >
      {children}
    </div>
  );
}

function ColNotes({
  value,
  onChange,
  ariaLabel,
  left,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  left: string;
  width: string;
}) {
  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-lined-notes"
      style={{
        position: "absolute",
        left,
        top: 0,
        width,
        height: "100%",
        boxSizing: "border-box",
        padding: "0 1.2mm",
        fontFamily: "inherit",
        fontSize: BODY,
        lineHeight: LINE,
        color: "#111",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    />
  );
}

function LogTable({
  page,
  onDate,
  onAction,
  onInvestigator,
  onChief,
}: {
  page: CustodyLogPageModel;
  onDate: (v: string) => void;
  onAction: (v: string) => void;
  onInvestigator: (v: string) => void;
  onChief: (v: string) => void;
}) {
  const cols = `${COL_DATE} minmax(0, 1fr) ${COL_SIGN} ${COL_SIGN}`;
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: `calc(${HEAD_H} + ${page.rows} * ${LINE})`,
        border: RULE,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          height: HEAD_H,
          flexShrink: 0,
          borderBottom: RULE,
          boxSizing: "border-box",
        }}
      >
        <Th borderRight>วัน เดือน ปี</Th>
        <Th borderRight>รายการกระทำเฉพาะวัน</Th>
        <Th borderRight>
          ลงชื่อพนักงาน
          <br />
          ผู้สอบสวน
        </Th>
        <Th>
          ลงชื่อหัวหน้า
          <br />
          พนักงานสอบสวน
        </Th>
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: `calc(${page.rows} * ${LINE})`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: cols,
          }}
        >
          <div style={{ borderRight: RULE }} />
          <div style={{ borderRight: RULE }} />
          <div style={{ borderRight: RULE }} />
          <div />
        </div>
        <ColNotes ariaLabel="วัน เดือน ปี" value={page.dateCol} onChange={onDate} left="0" width={COL_DATE} />
        <ColNotes
          ariaLabel="รายการกระทำเฉพาะวัน"
          value={page.actionCol}
          onChange={onAction}
          left={COL_DATE}
          width={`calc(100% - ${COL_DATE} - ${COL_SIGN} - ${COL_SIGN})`}
        />
        <ColNotes
          ariaLabel="ลงชื่อพนักงานผู้สอบสวน"
          value={page.investigatorCol}
          onChange={onInvestigator}
          left={`calc(100% - ${COL_SIGN} - ${COL_SIGN})`}
          width={COL_SIGN}
        />
        <ColNotes
          ariaLabel="ลงชื่อหัวหน้าพนักงานสอบสวน"
          value={page.chiefCol}
          onChange={onChief}
          left={`calc(100% - ${COL_SIGN})`}
          width={COL_SIGN}
        />
      </div>
    </div>
  );
}

function measureHostLines(host: HTMLDivElement, text: string): number {
  if (!text) return 0;
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return defaultCustodyLogCounters.action(text);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialCustodyLogDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: CustodyLogFields;
  onChange: <K extends keyof CustodyLogFields>(key: K, value: CustodyLogFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const dateHost = useRef<HTMLDivElement | null>(null);
  const actionHost = useRef<HTMLDivElement | null>(null);
  const invHost = useRef<HTMLDivElement | null>(null);
  const chiefHost = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);

  useLayoutEffect(() => {
    function makeHost(width: string) {
      const host = document.createElement("div");
      host.setAttribute("aria-hidden", "true");
      host.style.cssText = [
        "position:absolute",
        "left:-9999px",
        "top:0",
        `width:${width}`,
        "visibility:hidden",
        "pointer-events:none",
        "box-sizing:border-box",
        "padding:0 1.2mm",
        `font-family:${FONT}`,
        `font-size:${BODY}`,
        `line-height:${LINE}`,
        "white-space:pre-wrap",
        "overflow-wrap:anywhere",
        "word-break:break-word",
      ].join(";");
      document.body.appendChild(host);
      return host;
    }
    dateHost.current = makeHost("25.6mm");
    actionHost.current = makeHost("80mm");
    invHost.current = makeHost("35.6mm");
    chiefHost.current = makeHost("35.6mm");
    setMeasureReady(true);
    return () => {
      dateHost.current?.remove();
      actionHost.current?.remove();
      invHost.current?.remove();
      chiefHost.current?.remove();
      dateHost.current = null;
      actionHost.current = null;
      invHost.current = null;
      chiefHost.current = null;
    };
  }, []);

  const count: CustodyLogLineCounters = useMemo(() => {
    void measureReady;
    return {
      date: (text) => {
        const host = dateHost.current;
        if (!host) return defaultCustodyLogCounters.date(text);
        return measureHostLines(host, text);
      },
      action: (text) => {
        const host = actionHost.current;
        if (!host) return defaultCustodyLogCounters.action(text);
        return measureHostLines(host, text);
      },
      investigator: (text) => {
        const host = invHost.current;
        if (!host) return defaultCustodyLogCounters.investigator(text);
        return measureHostLines(host, text);
      },
      chief: (text) => {
        const host = chiefHost.current;
        if (!host) return defaultCustodyLogCounters.chief(text);
        return measureHostLines(host, text);
      },
    };
  }, [measureReady]);

  const pages = useMemo(() => packCustodyLogPages(fields, count), [fields, count]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchCol(
    key: "dateCol" | "actionCol" | "investigatorCol" | "chiefCol",
    sliceIndex: number,
    text: string,
  ) {
    onChange(
      key,
      pages.map((p) => (p.sliceIndex === sliceIndex ? text : p[key])).join(""),
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <article
          key={`cl-${page.index}`}
          data-sheet-index={page.index}
          className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
          style={{
            width: PAGE.w,
            height: PAGE.h,
            boxSizing: "border-box",
            overflow: "hidden",
            padding: "12mm 14mm 12mm",
            fontFamily: FONT,
            fontSize: BODY,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {page.showPageNo ? (
            <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              ({thaiNumeral(page.index + 1)})
            </p>
          ) : null}

          {page.showHeader ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "2.5mm", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/smart-police/garuda.png"
                  alt=""
                  width={84}
                  height={96}
                  style={{ display: "block", margin: "0 auto 1.2mm", height: "18mm", width: "auto" }}
                />
                <h1
                  style={{
                    margin: 0,
                    fontSize: TITLE,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  }}
                >
                  {CUSTODY_LOG_FORM_TITLE}
                </h1>
              </header>
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "8mm",
                    marginBottom: "1.2mm",
                  }}
                >
                  <Row style={{ marginBottom: 0 }}>
                    <T>คดีที่</T>
                    <Dot
                      aria-label="คดีที่"
                      value={fields.caseNo}
                      onChange={(v) => onChange("caseNo", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                  <Row style={{ marginBottom: 0 }}>
                    <T>สถานีตำรวจ</T>
                    <Dot
                      aria-label="สถานีตำรวจ"
                      value={fields.station}
                      onChange={(v) => onChange("station", v)}
                      flex
                      minCh={8}
                    />
                  </Row>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr",
                    alignItems: "stretch",
                    columnGap: "2mm",
                    margin: "1.2mm 0 0",
                    height: "14.5mm",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", paddingTop: "0.4mm" }}>
                    <T>คดีระหว่าง</T>
                  </div>
                  <CaseBrace />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      gap: "3.6mm",
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
                        lineHeight: DOT_LINE,
                        fontSize: BODY,
                      }}
                    >
                      <Dot
                        aria-label="ผู้กล่าวหาในคดี"
                        value={fields.complainantLine}
                        onChange={(v) => onChange("complainantLine", v)}
                        flex
                        minCh={10}
                      />
                      <T>ผู้กล่าวหา</T>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "2mm",
                        width: "100%",
                        lineHeight: DOT_LINE,
                        fontSize: BODY,
                      }}
                    >
                      <Dot
                        aria-label="ผู้ต้องหาในคดี"
                        value={fields.suspectLine}
                        onChange={(v) => onChange("suspectLine", v)}
                        flex
                        minCh={10}
                      />
                      <T>ผู้ต้องหา</T>
                    </div>
                  </div>
                </div>
                <Row style={{ marginTop: "6mm", marginBottom: "1.6mm" }}>
                  <T>ฐานความผิด</T>
                  <Dot
                    aria-label="ฐานความผิด"
                    value={fields.charge}
                    onChange={(v) => onChange("charge", v)}
                    flex
                    minCh={12}
                  />
                </Row>
                <Row style={{ marginBottom: "1.2mm" }}>
                  <T>วันและเวลาเริ่มการควบคุม</T>
                  <Dot
                    aria-label="วันและเวลาเริ่มการควบคุม"
                    value={fields.startWhen}
                    onChange={(v) => onChange("startWhen", v)}
                    flex
                    minCh={12}
                  />
                </Row>
              </div>
            </>
          ) : null}

          <LogTable
            page={page}
            onDate={(v) => patchCol("dateCol", page.sliceIndex, v)}
            onAction={(v) => patchCol("actionCol", page.sliceIndex, v)}
            onInvestigator={(v) => patchCol("investigatorCol", page.sliceIndex, v)}
            onChief={(v) => patchCol("chiefCol", page.sliceIndex, v)}
          />

          {page.showNotes ? (
            <div
              style={{
                flexShrink: 0,
                marginTop: "3mm",
                fontSize: BODY,
                lineHeight: 1.45,
              }}
            >
              <p style={{ margin: "0 0 1.2mm", textAlign: "justify" }}>{CUSTODY_LOG_NOTE_1}</p>
              <p style={{ margin: 0, textAlign: "justify" }}>{CUSTODY_LOG_NOTE_2}</p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
