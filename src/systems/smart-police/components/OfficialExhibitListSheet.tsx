"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EXHIBIT_LIST_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  formatExhibitListTotal,
  paginateExhibitListRows,
  type ExhibitListHeader,
} from "@/lib/smart-police/form-templates/exhibit-list";
import { thaiNumeral, type PropertyListRow } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "7.2mm";
const RULE = "0.55pt solid #111";

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

function Line({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field w-full min-w-0"
      style={{ fontSize: "inherit", lineHeight: "inherit", height: "auto", paddingBottom: "1px" }}
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
        margin: "0 0 0.8mm",
        lineHeight: LINE,
        fontSize: BODY,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function L({ children }: { children: ReactNode }) {
  return <span style={{ fontWeight: 700, flexShrink: 0 }}>{children}</span>;
}

function CellInput({
  value,
  onChange,
  ariaLabel,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  align?: "left" | "center" | "right";
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
    <div style={{ position: "relative", width: "100%", minHeight: LINE }}>
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

function CaseBrace() {
  return (
    <div aria-hidden style={{ width: "6mm", height: "100%" }}>
      <svg viewBox="0 0 24 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path
          d="M20 1 C9 1 7 14 7 25 L7 40 C7 47 3 50 3 50 C3 50 7 53 7 60 L7 75 C7 86 9 99 20 99"
          fill="none"
          stroke="#111"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const th: CSSProperties = {
  border: RULE,
  fontWeight: 700,
  textAlign: "center",
  verticalAlign: "middle",
  padding: "1.2mm 1mm",
  lineHeight: 1.25,
  background: "transparent",
};
const tdVert: CSSProperties = {
  borderLeft: RULE,
  borderRight: RULE,
  borderTop: "none",
  borderBottom: "none",
  verticalAlign: "top",
  padding: "0.5mm 1.2mm",
  overflow: "hidden",
  minHeight: LINE,
};
const ROW_MIN: CSSProperties = { height: "1px" };

function ExhibitTableHead() {
  return (
    <thead>
      <tr>
        <th style={th} rowSpan={2}>
          ลำดับที่
        </th>
        <th style={th} rowSpan={2}>
          รายการ
        </th>
        <th style={th} rowSpan={2}>
          จำนวน
        </th>
        <th style={th} colSpan={2}>
          ราคา
        </th>
        <th style={th} rowSpan={2}>
          ยึดจากใคร
        </th>
        <th style={{ ...th, lineHeight: 1.2 }} rowSpan={2}>
          วัน เดือน ปี
          <br />
          ที่ยึด
        </th>
        <th style={th} rowSpan={2}>
          หมายเหตุ
        </th>
      </tr>
      <tr>
        <th style={th}>บาท</th>
        <th style={th}>สตางค์</th>
      </tr>
    </thead>
  );
}

function ExhibitRow({
  row,
  n,
  onRowChange,
}: {
  row: PropertyListRow;
  n: number;
  onRowChange: <K extends keyof PropertyListRow>(id: string, key: K, value: PropertyListRow[K]) => void;
}) {
  return (
    <tr style={ROW_MIN}>
      <td
        style={{
          ...tdVert,
          ...ROW_MIN,
          textAlign: "center",
          fontWeight: 700,
          fontSize: BODY,
          lineHeight: 1.35,
        }}
      >
        {thaiNumeral(n)}.
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellWrap ariaLabel={`รายการที่ ${n}`} value={row.item} onChange={(v) => onRowChange(row.id, "item", v)} />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellInput
          ariaLabel={`จำนวนรายการที่ ${n}`}
          value={row.quantity}
          onChange={(v) => onRowChange(row.id, "quantity", v)}
          align="center"
        />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellInput
          ariaLabel={`ราคาบาทรายการที่ ${n}`}
          value={row.baht}
          onChange={(v) => onRowChange(row.id, "baht", v)}
          align="right"
        />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellInput
          ariaLabel={`ราคาสตางค์รายการที่ ${n}`}
          value={row.satang}
          onChange={(v) => onRowChange(row.id, "satang", v)}
          align="center"
        />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellWrap
          ariaLabel={`ยึดจากใครรายการที่ ${n}`}
          value={row.owner}
          onChange={(v) => onRowChange(row.id, "owner", v)}
        />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellInput
          ariaLabel={`วันที่ยึดรายการที่ ${n}`}
          value={row.seizedOn}
          onChange={(v) => onRowChange(row.id, "seizedOn", v)}
        />
      </td>
      <td style={{ ...tdVert, ...ROW_MIN }}>
        <CellWrap ariaLabel={`หมายเหตุรายการที่ ${n}`} value={row.note} onChange={(v) => onRowChange(row.id, "note", v)} />
      </td>
    </tr>
  );
}

export function OfficialExhibitListDocument({
  header,
  rows,
  onHeaderChange,
  onRowChange,
}: {
  header: ExhibitListHeader;
  rows: PropertyListRow[];
  onHeaderChange: <K extends keyof ExhibitListHeader>(key: K, value: ExhibitListHeader[K]) => void;
  onRowChange: <K extends keyof PropertyListRow>(id: string, key: K, value: PropertyListRow[K]) => void;
}) {
  const pages = paginateExhibitListRows(rows);
  const total = formatExhibitListTotal(rows);
  let seq = 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {pages.map((pageRows, pageIdx) => {
        const startSeq = seq;
        seq += pageRows.length;
        const isFirst = pageIdx === 0;
        return (
          <article
            key={`ex-page-${pageIdx}`}
            data-sheet-index={pageIdx}
            className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
            style={{
              width: PAGE.w,
              height: PAGE.h,
              boxSizing: "border-box",
              overflow: "hidden",
              padding: "16mm 14mm 14mm",
              fontFamily: FONT,
              fontSize: BODY,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isFirst ? (
              <header style={{ textAlign: "center", marginBottom: "4mm", flexShrink: 0 }}>
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
                  {EXHIBIT_LIST_FORM_TITLE}
                </h1>
              </header>
            ) : (
              <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
                {thaiNumeral(pageIdx + 1)}
              </p>
            )}

            {isFirst ? (
              <div style={{ flexShrink: 0, marginBottom: "3mm" }}>
                <Row>
                  <L>เลขที่บัญชีทรัพย์ของกลางลำดับที่</L>
                  <Dot
                    aria-label="เลขที่บัญชีทรัพย์ของกลางลำดับที่"
                    value={header.accountNo}
                    onChange={(v) => onHeaderChange("accountNo", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <L>ตามสำนวนการสอบสวนของสถานีตำรวจ</L>
                  <Dot
                    aria-label="สถานีตำรวจตามสำนวน"
                    value={header.stationName}
                    onChange={(v) => onHeaderChange("stationName", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <L>คดีที่</L>
                  <Dot
                    aria-label="คดีที่"
                    value={header.caseNumber}
                    onChange={(v) => onHeaderChange("caseNumber", v)}
                    flex
                    minCh={8}
                  />
                  <L>ลงวันที่</L>
                  <Dot
                    aria-label="ลงวันที่"
                    value={header.datedOn}
                    onChange={(v) => onHeaderChange("datedOn", v)}
                    flex
                    minCh={10}
                  />
                </Row>

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
                    <L>คดีระหว่าง</L>
                  </div>
                  <CaseBrace />
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
                      <Dot
                        aria-label="ผู้กล่าวหาในคดี"
                        value={header.complainantLine}
                        onChange={(v) => onHeaderChange("complainantLine", v)}
                        flex
                        minCh={10}
                      />
                      <L>ผู้กล่าวหา</L>
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
                      <Dot
                        aria-label="ผู้ต้องหาในคดี"
                        value={header.suspectLine}
                        onChange={(v) => onHeaderChange("suspectLine", v)}
                        flex
                        minCh={10}
                      />
                      <L>ผู้ต้องหา</L>
                    </div>
                  </div>
                </div>

                <Row>
                  <L>ข้อหา/ฐานความผิด</L>
                  <Dot
                    aria-label="ข้อหาหรือฐานความผิด"
                    value={header.chargeText}
                    onChange={(v) => onHeaderChange("chargeText", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <Line
                    aria-label="ข้อหาบรรทัด 2"
                    value={header.chargeLine2}
                    onChange={(v) => onHeaderChange("chargeLine2", v)}
                  />
                </Row>
              </div>
            ) : null}

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontSize: BODY,
                flex: 1,
                minHeight: 0,
              }}
            >
              <colgroup>
                <col style={{ width: "14mm" }} />
                <col />
                <col style={{ width: "18mm" }} />
                <col style={{ width: "20mm" }} />
                <col style={{ width: "16mm" }} />
                <col style={{ width: "30mm" }} />
                <col style={{ width: "26mm" }} />
                <col style={{ width: "20mm" }} />
              </colgroup>
              <ExhibitTableHead />
              <tbody>
                {pageRows.map((row, i) => (
                  <ExhibitRow key={row.id} row={row} n={startSeq + i + 1} onRowChange={onRowChange} />
                ))}
                <tr aria-hidden>
                  {Array.from({ length: 8 }, (_, i) => (
                    <td
                      key={`fill-${i}`}
                      style={{
                        ...tdVert,
                        height: "100%",
                        padding: 0,
                        ...(isFirst ? null : { borderBottom: RULE }),
                      }}
                    />
                  ))}
                </tr>
                {isFirst ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...th,
                        borderTop: RULE,
                        height: "11mm",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: "12mm",
                          width: "100%",
                          fontSize: BODY,
                          lineHeight: LINE,
                        }}
                      >
                        <span>
                          รวม{" "}
                          <span style={{ display: "inline-block", minWidth: "12mm", textAlign: "center" }}>
                            {total.itemsThai}
                          </span>{" "}
                          รายการ
                        </span>
                        <span>
                          ราคารวม{" "}
                          <span style={{ display: "inline-block", minWidth: "28mm", textAlign: "right" }}>
                            {total.baht}.{total.satang}
                          </span>{" "}
                          บาท
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            {isFirst ? (
              <div style={{ flexShrink: 0, marginTop: "3mm" }}>
                <p
                  style={{
                    margin: "0 0 2.5mm",
                    fontSize: BODY,
                    lineHeight: LINE,
                    textAlign: "left",
                    textIndent: "12mm",
                  }}
                >
                  ข้าฯ ขอรับรองว่าทรัพย์สินของกลาง ตามรายการดังกล่าวข้างต้น ได้บันทึกขึ้นถูกต้องตรงกับความเป็นจริง
                  ได้อ่านให้ฟังและตรวจดูแล้วรับว่าถูกต้อง
                </p>
                <div
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "4mm",
                    rowGap: "1.2mm",
                    fontSize: BODY,
                  }}
                >
                  {(
                    [
                      ["ผู้ต้องหา", "signSuspect"],
                      ["ผู้กล่าวหา", "signComplainant"],
                      ["พยาน", "signWitness"],
                      ["พงส. / บันทึก / อ่าน", "signOfficer"],
                    ] as const
                  ).map(([label, key]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: "2mm",
                        minHeight: LINE,
                        lineHeight: LINE,
                        minWidth: 0,
                      }}
                    >
                      <L>ลงชื่อ</L>
                      <Dot
                        aria-label={`ลงชื่อ${label}`}
                        value={header[key]}
                        onChange={(v) => onHeaderChange(key, v)}
                        flex
                        minCh={8}
                      />
                      <span style={{ flexShrink: 0 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "58%",
                  marginLeft: "auto",
                  marginTop: "4mm",
                  flexShrink: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  gap: "2mm",
                  minHeight: LINE,
                  lineHeight: LINE,
                  fontSize: BODY,
                }}
              >
                <L>ลงชื่อ</L>
                <Dot
                  aria-label="ลงชื่อพงส. บันทึก อ่าน"
                  value={header.signOfficer}
                  onChange={(v) => onHeaderChange("signOfficer", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>พงส. / บันทึก / อ่าน</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
