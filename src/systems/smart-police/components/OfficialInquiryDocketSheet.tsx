"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { INQUIRY_DOCKET_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  paginateInquiryDocketRows,
  type InquiryDocketHeader,
  type InquiryDocketRow,
} from "@/lib/smart-police/form-templates/inquiry-docket";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const TITLE = "18pt";
const LINE = "6.2mm";
const RULE = "0.75pt solid #111";
const RULE_THICK = "1.3pt solid #111";

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
        lineHeight: 1.35,
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
    <div style={{ position: "relative", width: "100%", minHeight: "6.2mm", height: "100%" }}>
      <div
        aria-hidden
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          visibility: "hidden",
          lineHeight: 1.35,
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
          lineHeight: 1.35,
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
  padding: "0.8mm 1.2mm",
  overflow: "hidden",
};

function DocketHead() {
  return (
    <thead>
      <tr>
        <th style={{ ...th, width: "14mm" }} rowSpan={2}>
          ลำดับ
          <br />
          ที่
        </th>
        <th style={th} rowSpan={2}>
          ชนิดและเลขหมาย
          <br />
          หนังสือ
        </th>
        <th style={th} rowSpan={2}>
          ของ
        </th>
        <th style={th} rowSpan={2}>
          ถึง
        </th>
        <th style={th} colSpan={2}>
          หมายเหตุ
        </th>
      </tr>
      <tr>
        <th style={{ ...th, width: "18mm" }}>จำนวน</th>
        <th style={{ ...th, width: "18mm" }}>แผ่น</th>
      </tr>
    </thead>
  );
}

export function OfficialInquiryDocketDocument({
  header,
  rows,
  onHeaderChange,
  onRowChange,
}: {
  header: InquiryDocketHeader;
  rows: InquiryDocketRow[];
  onHeaderChange: <K extends keyof InquiryDocketHeader>(key: K, value: InquiryDocketHeader[K]) => void;
  onRowChange: <K extends keyof InquiryDocketRow>(id: string, key: K, value: InquiryDocketRow[K]) => void;
}) {
  const pages = paginateInquiryDocketRows(rows);
  let seq = 0;

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((pageRows, pageIdx) => {
        const startSeq = seq;
        seq += pageRows.length;
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pages.length - 1;
        return (
          <article
            key={`dk-${pageIdx}`}
            data-sheet-index={pageIdx}
            className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
            style={{
              width: PAGE.w,
              height: PAGE.h,
              boxSizing: "border-box",
              overflow: "hidden",
              padding: isFirst ? "12mm 14mm 14mm" : "16mm 14mm 14mm",
              fontFamily: FONT,
              fontSize: BODY,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isFirst ? (
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

            {isFirst ? (
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

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <table
                style={{
                  width: "100%",
                  height: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  borderTop: RULE_THICK,
                  borderBottom: RULE_THICK,
                  borderLeft: RULE,
                  borderRight: RULE,
                }}
              >
                <DocketHead />
                <tbody>
                  {pageRows.map((row, i) => {
                    const n = startSeq + i + 1;
                    return (
                      <tr key={row.id}>
                        <td style={{ ...td, textAlign: "center", fontWeight: 700, width: "14mm" }}>
                          {thaiNumeral(n)}
                        </td>
                        <td style={td}>
                          <CellWrap
                            ariaLabel={`ชนิดและเลขหมายหนังสือ รายการที่ ${n}`}
                            value={row.kind}
                            onChange={(v) => onRowChange(row.id, "kind", v)}
                          />
                        </td>
                        <td style={td}>
                          <CellWrap
                            ariaLabel={`ของ รายการที่ ${n}`}
                            value={row.from}
                            onChange={(v) => onRowChange(row.id, "from", v)}
                          />
                        </td>
                        <td style={td}>
                          <CellWrap
                            ariaLabel={`ถึง รายการที่ ${n}`}
                            value={row.to}
                            onChange={(v) => onRowChange(row.id, "to", v)}
                          />
                        </td>
                        <td style={{ ...td, width: "18mm", textAlign: "center" }}>
                          <CellInput
                            ariaLabel={`จำนวน รายการที่ ${n}`}
                            value={row.copies}
                            onChange={(v) => onRowChange(row.id, "copies", v)}
                          />
                        </td>
                        <td style={{ ...td, width: "18mm", textAlign: "center" }}>
                          <CellInput
                            ariaLabel={`แผ่น รายการที่ ${n}`}
                            value={row.sheets}
                            onChange={(v) => onRowChange(row.id, "sheets", v)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {isLast ? (
                    <tr>
                      <td style={{ ...td, borderTop: RULE, height: "16mm" }} />
                      <td style={{ ...td, borderTop: RULE }} />
                      <td
                        style={{
                          ...td,
                          borderTop: RULE,
                          textAlign: "center",
                          fontWeight: 700,
                          lineHeight: 1.35,
                          verticalAlign: "middle",
                        }}
                      >
                        รวมเอกสาร
                        <br />
                        ร.ต.อ.
                      </td>
                      <td
                        style={{
                          ...td,
                          borderTop: RULE,
                          textAlign: "center",
                          fontWeight: 700,
                          lineHeight: 1.35,
                          verticalAlign: "middle",
                        }}
                      >
                        รายการ
                        <br />
                        ตรวจ/บันทึก
                      </td>
                      <td style={{ ...td, borderTop: RULE, width: "18mm", verticalAlign: "middle" }}>
                        <CellInput
                          ariaLabel="รวมจำนวน"
                          value={header.totalCopies}
                          onChange={(v) => onHeaderChange("totalCopies", v)}
                        />
                      </td>
                      <td style={{ ...td, borderTop: RULE, width: "18mm", verticalAlign: "middle" }}>
                        <CellInput
                          ariaLabel="รวมแผ่น"
                          value={header.totalSheets}
                          onChange={(v) => onHeaderChange("totalSheets", v)}
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}
