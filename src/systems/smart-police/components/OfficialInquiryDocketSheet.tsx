"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { INQUIRY_DOCKET_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  defaultInquiryDocketCounters,
  packInquiryDocketPages,
  summarizeInquiryDocket,
  type InquiryDocketHeader,
  type InquiryDocketLineCounters,
  type InquiryDocketPageModel,
  type InquiryDocketRow,
} from "@/lib/smart-police/form-templates/inquiry-docket";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "7.2mm";
const RULE = "0.75pt solid #111";
const RULE_THICK = "1.3pt solid #111";
const COL_SEQ = "16mm";
const COL_KIND = "42%";
const COL_QTY = "28mm";
const KIND_MEASURE_W = "72mm";
const FROM_MEASURE_W = "30mm";
const QTY_MEASURE_W = "26mm";

function measureHostLines(host: HTMLDivElement, text: string, fallback: (t: string) => number): number {
  if (!text) return 0;
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return fallback(text);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

function Dot({
  value,
  onChange,
  "aria-label": ariaLabel,
  minCh = 4,
  flex,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  "aria-label"?: string;
  minCh?: number;
  flex?: boolean;
  readOnly?: boolean;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      onChange={readOnly || !onChange ? undefined : (e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field align-baseline", flex ? "min-w-0 flex-1" : "inline")}
      style={{
        minWidth: flex ? 0 : `${minCh}ch`,
        width: flex ? "100%" : `${Math.max(minCh, (value || "").length + 1)}ch`,
        fontSize: "inherit",
        lineHeight: "inherit",
        height: "auto",
        paddingBottom: "1px",
        textAlign: readOnly ? "center" : undefined,
      }}
    />
  );
}

function L({ children }: { children: ReactNode }) {
  return <span style={{ fontWeight: 700, flexShrink: 0 }}>{children}</span>;
}

function CellInput({
  value,
  onChange,
  ariaLabel,
  align = "center",
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  align?: "left" | "center";
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field w-full min-w-0"
      style={{
        fontSize: "inherit",
        lineHeight: LINE,
        height: "auto",
        textAlign: align,
        overflow: "hidden",
      }}
    />
  );
}

function CellWrap({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: LINE }}>
      <div
        aria-hidden
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          visibility: "hidden",
          lineHeight: LINE,
        }}
      >
        {value || "\u00a0"}
      </div>
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={1}
        className="sp-word-field w-full min-w-0"
        style={{
          position: "absolute",
          inset: 0,
          fontSize: "inherit",
          lineHeight: LINE,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          resize: "none",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

const th: CSSProperties = {
  border: RULE,
  borderBottom: RULE,
  fontWeight: 700,
  textAlign: "center",
  verticalAlign: "middle",
  padding: "1.4mm 1mm",
  lineHeight: 1.25,
  background: "transparent",
};
const td: CSSProperties = {
  borderLeft: RULE,
  borderRight: RULE,
  borderTop: "none",
  borderBottom: "none",
  verticalAlign: "top",
  padding: "0.4mm 1mm",
  minHeight: LINE,
};

function DocketHead() {
  return (
    <thead>
      <tr>
        <th style={{ ...th, width: COL_SEQ }}>
          ลำดับ
          <br />
          ที่
        </th>
        <th style={{ ...th, width: COL_KIND }}>
          ชนิดและเลขหมาย
          <br />
          หนังสือ
        </th>
        <th style={th}>ของ</th>
        <th style={th}>ถึง</th>
        <th style={{ ...th, width: COL_QTY }}>จำนวน/แผ่น</th>
      </tr>
    </thead>
  );
}

function DocketFiller() {
  return (
    <div
      aria-hidden
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: `${COL_SEQ} ${COL_KIND} minmax(0,1fr) minmax(0,1fr) ${COL_QTY}`,
        borderLeft: RULE,
        borderRight: RULE,
      }}
    >
      <div style={{ borderRight: RULE }} />
      <div style={{ borderRight: RULE }} />
      <div style={{ borderRight: RULE }} />
      <div style={{ borderRight: RULE }} />
      <div />
    </div>
  );
}

function patchFragments(
  pages: InquiryDocketPageModel[],
  rowId: string,
  key: "kind" | "from" | "to",
  fragIndex: number,
  value: string,
): string {
  const parts: string[] = [];
  for (const page of pages) {
    for (const row of page.rows) {
      if (row.rowId === rowId) parts[row.fragIndex] = row[key];
    }
  }
  parts[fragIndex] = value;
  return parts.join("");
}

export function OfficialInquiryDocketDocument({
  header,
  rows,
  onHeaderChange,
  onRowChange,
  onPageCount,
}: {
  header: InquiryDocketHeader;
  rows: InquiryDocketRow[];
  onHeaderChange: <K extends keyof InquiryDocketHeader>(key: K, value: InquiryDocketHeader[K]) => void;
  onRowChange: <K extends keyof InquiryDocketRow>(id: string, key: K, value: InquiryDocketRow[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const kindHost = useRef<HTMLDivElement | null>(null);
  const fromHost = useRef<HTMLDivElement | null>(null);
  const qtyHost = useRef<HTMLDivElement | null>(null);
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
        "padding:0 1mm",
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
    kindHost.current = makeHost(KIND_MEASURE_W);
    fromHost.current = makeHost(FROM_MEASURE_W);
    qtyHost.current = makeHost(QTY_MEASURE_W);
    setMeasureReady(true);
    return () => {
      kindHost.current?.remove();
      fromHost.current?.remove();
      qtyHost.current?.remove();
      kindHost.current = null;
      fromHost.current = null;
      qtyHost.current = null;
    };
  }, []);

  const count: InquiryDocketLineCounters = useMemo(() => {
    void measureReady;
    return {
      kind: (text) => {
        const host = kindHost.current;
        if (!host) return defaultInquiryDocketCounters.kind(text);
        return measureHostLines(host, text, defaultInquiryDocketCounters.kind);
      },
      from: (text) => {
        const host = fromHost.current;
        if (!host) return defaultInquiryDocketCounters.from(text);
        return measureHostLines(host, text, defaultInquiryDocketCounters.from);
      },
      to: (text) => {
        const host = fromHost.current;
        if (!host) return defaultInquiryDocketCounters.to(text);
        return measureHostLines(host, text, defaultInquiryDocketCounters.to);
      },
      qty: (text) => {
        const host = qtyHost.current;
        if (!host) return defaultInquiryDocketCounters.qty(text);
        return measureHostLines(host, text, defaultInquiryDocketCounters.qty);
      },
    };
  }, [measureReady]);

  const pages = useMemo(() => packInquiryDocketPages(rows, count), [rows, count]);
  const summary = useMemo(() => summarizeInquiryDocket(rows), [rows]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  const patchCell = useCallback(
    (rowId: string, key: "kind" | "from" | "to", fragIndex: number, value: string) => {
      onRowChange(rowId, key, patchFragments(pages, rowId, key, fragIndex, value));
    },
    [onRowChange, pages],
  );

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <article
          key={`dk-${page.index}`}
          data-sheet-index={page.index}
          className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
          style={{
            width: PAGE.w,
            height: PAGE.h,
            boxSizing: "border-box",
            overflow: "hidden",
            padding: page.showHeader ? "12mm 14mm 14mm" : "16mm 14mm 14mm",
            fontFamily: FONT,
            fontSize: BODY,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {page.showPageNo ? (
            <p style={{ margin: "0 0 2mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              -{thaiNumeral(page.index + 1)}-
            </p>
          ) : null}

          {page.showHeader ? (
            <header style={{ textAlign: "center", marginBottom: "3mm", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smart-police/garuda.png"
                alt=""
                width={84}
                height={96}
                style={{ display: "block", margin: "0 auto 1.5mm", height: "22mm", width: "auto" }}
              />
              <h1
                style={{
                  margin: 0,
                  fontSize: TITLE,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textDecoration: "underline",
                  textUnderlineOffset: "1.2mm",
                }}
              >
                {INQUIRY_DOCKET_FORM_TITLE}
              </h1>
            </header>
          ) : null}

          {page.showHeader ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1.1fr) auto minmax(0,1.4fr) auto minmax(0,1fr) auto minmax(0,1fr)",
                columnGap: "2mm",
                alignItems: "baseline",
                marginBottom: "2.5mm",
                flexShrink: 0,
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <L>คดีที่</L>
              <Dot
                aria-label="คดีที่"
                value={header.caseNo}
                onChange={(v) => onHeaderChange("caseNo", v)}
                flex
                minCh={4}
              />
              <L>สถานีตำรวจ</L>
              <Dot
                aria-label="สถานีตำรวจ"
                value={header.station}
                onChange={(v) => onHeaderChange("station", v)}
                flex
                minCh={6}
              />
              <L>อำเภอ</L>
              <Dot
                aria-label="อำเภอ"
                value={header.district}
                onChange={(v) => onHeaderChange("district", v)}
                flex
                minCh={4}
              />
              <L>จังหวัด</L>
              <Dot
                aria-label="จังหวัด"
                value={header.province}
                onChange={(v) => onHeaderChange("province", v)}
                flex
                minCh={4}
              />
            </div>
          ) : null}

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              borderTop: RULE_THICK,
              borderBottom: RULE_THICK,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontSize: BODY,
                flexShrink: 0,
                borderLeft: RULE,
                borderRight: RULE,
              }}
            >
              <colgroup>
                <col style={{ width: COL_SEQ }} />
                <col style={{ width: COL_KIND }} />
                <col />
                <col />
                <col style={{ width: COL_QTY }} />
              </colgroup>
              <DocketHead />
              <tbody>
                {page.rows.map((row) => {
                  const n = row.seq;
                  return (
                    <tr key={`${row.rowId}-${row.fragIndex}`}>
                      <td style={{ ...td, textAlign: "center", fontWeight: 700, width: COL_SEQ }}>
                        {row.showSeq ? thaiNumeral(n) : ""}
                      </td>
                      <td style={{ ...td, width: COL_KIND }}>
                        <CellWrap
                          ariaLabel={`ชนิดและเลขหมายหนังสือ รายการที่ ${n}`}
                          value={row.kind}
                          onChange={(v) => patchCell(row.rowId, "kind", row.fragIndex, v)}
                        />
                      </td>
                      <td style={td}>
                        <CellWrap
                          ariaLabel={`ของ รายการที่ ${n}`}
                          value={row.from}
                          onChange={(v) => patchCell(row.rowId, "from", row.fragIndex, v)}
                        />
                      </td>
                      <td style={td}>
                        <CellWrap
                          ariaLabel={`ถึง รายการที่ ${n}`}
                          value={row.to}
                          onChange={(v) => patchCell(row.rowId, "to", row.fragIndex, v)}
                        />
                      </td>
                      <td style={{ ...td, width: COL_QTY, textAlign: "center" }}>
                        {row.showSeq ? (
                          <CellInput
                            ariaLabel={`จำนวน/แผ่น รายการที่ ${n}`}
                            value={row.qty}
                            onChange={(v) => onRowChange(row.rowId, "qty", v)}
                          />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <DocketFiller />
            {page.showFooter ? (
              <div
                style={{
                  flexShrink: 0,
                  borderTop: RULE,
                  borderLeft: RULE,
                  borderRight: RULE,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2mm",
                  padding: "1.6mm 3mm 2.2mm",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "baseline",
                    gap: "1.5mm",
                    width: "100%",
                    lineHeight: LINE,
                    fontSize: BODY,
                  }}
                >
                  <L>รวมเอกสาร</L>
                  <Dot
                    aria-label="รวมเอกสารรายการ"
                    value={thaiNumeral(summary.items)}
                    minCh={10}
                    flex
                    readOnly
                  />
                  <L>รายการ</L>
                  <span style={{ width: "6mm", flexShrink: 0 }} />
                  <L>จำนวน</L>
                  <Dot
                    aria-label="จำนวนแผ่นรวม"
                    value={thaiNumeral(summary.sheets)}
                    minCh={8}
                    readOnly
                  />
                  <L>แผ่น</L>
                </div>
                <div
                  style={{
                    width: "62%",
                    marginLeft: "auto",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    gap: "1.5mm",
                    lineHeight: LINE,
                    fontSize: BODY,
                  }}
                >
                  <span style={{ flexShrink: 0, fontWeight: 700 }}>ลงชื่อ</span>
                  <Dot
                    aria-label="ลงชื่อตรวจบันทึก"
                    value={header.signName}
                    onChange={(v) => onHeaderChange("signName", v)}
                    flex
                    minCh={10}
                  />
                  <span style={{ flexShrink: 0, fontWeight: 700 }}>ตรวจ/บันทึก</span>
                </div>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
