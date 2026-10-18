"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  StatementQaEditor,
  type QaFocus,
  type QaFocusRequest,
} from "@/systems/smart-police/components/StatementQaEditor";
import {
  statementPageSlot,
  type StatementHeaderFields,
  type StatementPage,
} from "@/lib/smart-police/form-templates";

/**
 * แม่แบบคำให้การ ส ๕๖-๔ — ออกแบบใหม่เป็นเอกสาร HTML (ไม่ทับพิกัด PNG)
 * พิมพ์บนจุดไข่ปลาในช่องจริง · ระยะแถวคงที่
 */

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const TITLE = "15pt";
/** ระยะแถวช่องพิมพ์ด้านบน (สถานี · ที่อยู่ ฯลฯ) */
const LINE = "6.2mm";
/** ระยะบรรทัดโซนถาม–ตอบ — กว้างกว่าแถวด้านบนเล็กน้อย อ่าน/แตะง่าย */
const STMT_LINE = "7.8mm";

function Dot({
  value,
  onChange,
  "aria-label": ariaLabel,
  minCh = 4,
  flex,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  minCh?: number;
  flex?: boolean;
  className?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field align-baseline", flex ? "min-w-0 flex-1" : "inline", className)}
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

function LinedBody(props: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  minHeight: string;
  fill?: boolean;
  onOverflow?: (text: string, focus: QaFocus | null) => void;
  focusRequest?: QaFocusRequest | null;
}) {
  return <StatementQaEditor {...props} lineHeight={STMT_LINE} fontSize={BODY} />;
}

/** กรอบเส้นหน้าหลัง/ใบต่อ — ด้านเย็บเล่มเว้นกว้าง · เส้นตั้งชิดด้านเย็บ */
const LINED_TOP = "28mm";
const LINED_BOTTOM = "22mm";
const LINED_EDGE = "14mm";
const LINED_BINDING = "50mm";
const LINED_RULE = "0.55pt solid #111";

export function OfficialStatementFormSheet({
  header,
  pages,
  pageIndex,
  onHeaderChange,
  onPageTextChange,
  onOverflow,
  focusRequest,
  onActivate,
  className,
}: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  pageIndex: number;
  formTitle?: string;
  onHeaderChange: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  onPageTextChange: (pageIdx: number, text: string) => void;
  /** ข้อความล้นหน้านี้ → ไหลไปหน้าถัดไป */
  onOverflow?: (text: string, focus: QaFocus | null) => void;
  focusRequest?: QaFocusRequest | null;
  onActivate?: (pageIdx: number) => void;
  onQaChange?: unknown;
  onAddQa?: unknown;
  onRemoveQa?: unknown;
  className?: string;
}) {
  const h = header;
  const set = onHeaderChange;
  const page = pages[pageIndex];
  const slot = statementPageSlot(pageIndex);
  const isLinedOnly = slot.kind === "main" || slot.kind === "cont";
  const isFrontCont = slot.kind === "cont" && slot.side === "หน้า";

  return (
    <article
      data-sheet-index={pageIndex}
      className={cn("sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none", className)}
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        padding: isLinedOnly ? 0 : "16mm 12mm 14mm 6mm",
        fontFamily: FONT,
        fontSize: BODY,
        lineHeight: 1.25,
        overflow: "hidden",
      }}
      onFocusCapture={() => onActivate?.(pageIndex)}
    >
      {isLinedOnly ? (
        <>
          {isFrontCont ? (
            <>
              <Row
                style={{
                  position: "absolute",
                  top: "14mm",
                  left: `calc(${LINED_BINDING} + 2.5mm)`,
                  right: LINED_EDGE,
                }}
              >
                <L>ใบต่อคำให้การ ของ</L>
                <Dot aria-label="ใบต่อของ" value={h.partyName} onChange={(v) => set("partyName", v)} flex minCh={10} />
                <L>แผ่น</L>
                <span
                  style={{
                    minWidth: "16mm",
                    textAlign: "center",
                    borderBottom: "0.5pt dotted #111",
                    lineHeight: LINE,
                  }}
                >
                  {slot.sheetNo}
                </span>
              </Row>
              <p
                style={{
                  position: "absolute",
                  left: LINED_EDGE,
                  bottom: LINED_BOTTOM,
                  margin: 0,
                  fontSize: "10pt",
                }}
              >
                ({slot.formCode})
              </p>
            </>
          ) : null}
          <div
            className="flex flex-col"
            style={{
              position: "absolute",
              top: LINED_TOP,
              bottom: LINED_BOTTOM,
              ...(isFrontCont
                ? { left: LINED_BINDING, right: LINED_EDGE, borderLeft: LINED_RULE, paddingLeft: "2.5mm" }
                : { left: LINED_EDGE, right: LINED_BINDING, borderRight: LINED_RULE, paddingRight: "2.5mm" }),
            }}
          >
            <LinedBody
              ariaLabel={`${slot.label} — พิมพ์ถาม ตอบ บนเส้น`}
              minHeight="40mm"
              fill
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(pageIndex, t)}
              onOverflow={onOverflow}
              focusRequest={focusRequest}
            />
          </div>
        </>
      ) : (
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: "40mm 1fr",
            gridTemplateRows: "auto 1fr",
            columnGap: "0",
          }}
        >
          {/* แถวบนซ้ายว่าง — ให้คำให้การของ เริ่มแนวเดียวกับสถานีตำรวจ */}
          <div
            aria-hidden
            style={{
              borderRight: "0.55pt solid #111",
              paddingRight: "2.5mm",
            }}
          />

          {/* หัวครุฑ + ชื่อแบบฟอร์ม */}
          <header style={{ textAlign: "center", marginBottom: "2.5mm", paddingLeft: "3.5mm" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/smart-police/garuda.png"
              alt=""
              width={84}
              height={96}
              style={{ display: "block", margin: "0 auto 1.2mm", height: "24mm", width: "auto" }}
            />
            <p style={{ margin: 0, fontSize: "20pt", fontWeight: 700, lineHeight: 1.15 }}>
              สำนักงานตำรวจแห่งชาติ
            </p>
            <h1
              style={{
                margin: "0.6mm 0 0",
                fontSize: TITLE,
                fontWeight: 700,
                lineHeight: 1.2,
                textDecoration: "underline",
                textUnderlineOffset: "1mm",
              }}
            >
              บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน
            </h1>
          </header>

          {/* แถบซ้าย — เริ่มที่แถวสถานีตำรวจ */}
          <aside
            style={{
              borderRight: "0.55pt solid #111",
              paddingRight: "2.5mm",
              fontSize: SMALL,
              lineHeight: 1.25,
              display: "flex",
              flexDirection: "column",
              gap: "2.5mm",
              minHeight: 0,
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>คำให้การของ</div>
              <Line aria-label="คำให้การของ" value={h.partyName} onChange={(v) => set("partyName", v)} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1mm" }}>
              <span style={{ fontWeight: 700 }}>เป็น</span>
              <Dot
                aria-label="เป็น"
                value={h.partyRoleLabel}
                onChange={(v) => set("partyRoleLabel", v)}
                minCh={8}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>หมายเลขโทรศัพท์</div>
              <Line aria-label="โทรศัพท์" value={h.partyPhone} onChange={(v) => set("partyPhone", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>บัตรประจำตัวประชาชน</div>
              <Line aria-label="บัตรประชาชน" value={h.partyIdCard} onChange={(v) => set("partyIdCard", v)} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1mm", minWidth: 0 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>ออกเมื่อ</span>
              <Dot
                aria-label="ออกเมื่อ"
                value={h.idIssuedOn}
                onChange={(v) => set("idIssuedOn", v)}
                flex
                minCh={3}
              />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1mm", minWidth: 0 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>หมดอายุ</span>
              <Dot
                aria-label="หมดอายุ"
                value={h.idExpiresOn}
                onChange={(v) => set("idExpiresOn", v)}
                flex
                minCh={3}
              />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1mm", minWidth: 0 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>ออกให้ ณ</span>
              <Dot
                aria-label="ออกให้ ณ"
                value={h.idIssuedAt}
                onChange={(v) => set("idIssuedAt", v)}
                flex
                minCh={3}
              />
            </div>
            <p style={{ textAlign: "center", marginTop: "8mm", fontSize: SMALL }}>
              <b>ลงชื่อ</b>
              <span
                style={{
                  display: "inline-block",
                  minWidth: "12mm",
                  borderBottom: "0.5pt dotted #111",
                  margin: "0 1mm",
                }}
              />
              <b>บันทึก</b>
            </p>
            <p style={{ marginTop: "auto", fontSize: "9pt", color: "#444" }}>(ส ๕๖ - ๔)</p>
          </aside>

          {/* เนื้อหาหลัก — สถานีตำรวจ อยู่แนวเดียวกับคำให้การของ */}
          <div
            style={{
              paddingLeft: "3.5mm",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              minHeight: 0,
              height: "100%",
            }}
          >
            {/* แถวแรก: ชิดขอบซ้าย–ขวาของคอลัมน์เนื้อหา */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                columnGap: "2mm",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>สถานีตำรวจ</L>
                <Dot
                  aria-label="สถานีตำรวจ"
                  value={h.stationName}
                  onChange={(v) => set("stationName", v)}
                  flex
                  minCh={4}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>เขต/อำเภอ</L>
                <Dot
                  aria-label="เขตอำเภอสถานี"
                  value={h.district}
                  onChange={(v) => set("district", v)}
                  flex
                  minCh={3}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>จังหวัด</L>
                <Dot
                  aria-label="จังหวัด"
                  value={h.province}
                  onChange={(v) => set("province", v)}
                  flex
                  minCh={4}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "baseline",
                gap: "0 4mm",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
                width: "100%",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "baseline", gap: "1.2mm" }}>
                <L>วันที่</L>
                <Dot aria-label="วันที่" value={h.dayThai} onChange={(v) => set("dayThai", v)} minCh={3} />
              </div>
              <div style={{ display: "inline-flex", alignItems: "baseline", gap: "1.2mm" }}>
                <L>เดือน</L>
                <Dot aria-label="เดือน" value={h.monthThai} onChange={(v) => set("monthThai", v)} minCh={6} />
              </div>
              <div style={{ display: "inline-flex", alignItems: "baseline", gap: "1.2mm" }}>
                <L>พ.ศ.</L>
                <Dot aria-label="พ.ศ." value={h.yearThai} onChange={(v) => set("yearThai", v)} minCh={4} />
              </div>
            </div>

            {/* คดีระหว่าง — ปีกกา · เส้นบนชิดปลายบน · เส้นล่างชิดปลายล่าง */}
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
                  <Dot
                    aria-label="ผู้กล่าวหาในคดี"
                    value={h.complainantLine}
                    onChange={(v) => set("complainantLine", v)}
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
                    value={h.suspectLine}
                    onChange={(v) => set("suspectLine", v)}
                    flex
                    minCh={10}
                  />
                  <L>ผู้ต้องหา</L>
                </div>
              </div>
            </div>

            <Row style={{ marginTop: "3mm" }}>
              <L>ต่อหน้า</L>
              <Dot
                aria-label="ต่อหน้า"
                value={h.investigator}
                onChange={(v) => set("investigator", v)}
                flex
                minCh={12}
              />
            </Row>
            <Row>
              <Line aria-label="ต่อหน้าบรรทัด2" value={h.commanderLine} onChange={(v) => set("commanderLine", v)} />
            </Row>
            <Row>
              <L>สอบสวนที่</L>
              <Dot
                aria-label="สอบสวนที่"
                value={h.interviewPlace}
                onChange={(v) => set("interviewPlace", v)}
                flex
                minCh={10}
              />
            </Row>

            {/* ชื่อ…อาชีพ — ขยายชิดขอบซ้าย–ขวา */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "2mm",
                width: "100%",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <L>ชื่อ</L>
              <Dot aria-label="ชื่อ" value={h.partyName} onChange={(v) => set("partyName", v)} flex minCh={8} />
              <L>อายุ</L>
              <Dot aria-label="อายุ" value={h.partyAge} onChange={(v) => set("partyAge", v)} minCh={3} />
              <span style={{ flexShrink: 0 }}>ปี</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                columnGap: "2mm",
                width: "100%",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>เชื้อชาติ</L>
                <Dot aria-label="เชื้อชาติ" value={h.ethnicity} onChange={(v) => set("ethnicity", v)} flex minCh={3} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>สัญชาติ</L>
                <Dot
                  aria-label="สัญชาติ"
                  value={h.partyNationality}
                  onChange={(v) => set("partyNationality", v)}
                  flex
                  minCh={3}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>ศาสนา</L>
                <Dot aria-label="ศาสนา" value={h.religion} onChange={(v) => set("religion", v)} flex minCh={3} />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.5mm",
                width: "100%",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <L>อาชีพ</L>
              <Dot
                aria-label="อาชีพ"
                value={h.partyOccupation}
                onChange={(v) => set("partyOccupation", v)}
                flex
                minCh={8}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                width: "100%",
                minHeight: LINE,
                margin: "0 0 1.2mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <Line
                aria-label="อาชีพบรรทัด2"
                value={h.partyOccupationLine2 ?? ""}
                onChange={(v) => set("partyOccupationLine2", v)}
              />
            </div>

            {/* ที่อยู่…เกี่ยวข้อง — ขยายชิดขอบซ้าย–ขวา */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.7fr 1.2fr",
                columnGap: "2mm",
                width: "100%",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>อยู่บ้านเลขที่</L>
                <Dot aria-label="บ้านเลขที่" value={h.houseNo} onChange={(v) => set("houseNo", v)} flex minCh={2} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>หมู่ที่</L>
                <Dot aria-label="หมู่ที่" value={h.moo} onChange={(v) => set("moo", v)} flex minCh={2} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>แขวง/ตำบล</L>
                <Dot aria-label="แขวงตำบล" value={h.tambon} onChange={(v) => set("tambon", v)} flex minCh={3} />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "2mm",
                width: "100%",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>เขต/อำเภอ</L>
                <Dot
                  aria-label="เขตอำเภอที่อยู่"
                  value={h.amphoe || h.district}
                  onChange={(v) => set("amphoe", v)}
                  flex
                  minCh={3}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>จังหวัด</L>
                <Dot
                  aria-label="จังหวัดที่อยู่"
                  value={h.province}
                  onChange={(v) => set("province", v)}
                  flex
                  minCh={4}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "2mm",
                width: "100%",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>ชื่อผู้ใหญ่บ้าน</L>
                <Dot
                  aria-label="ผู้ใหญ่บ้าน"
                  value={h.villageHead}
                  onChange={(v) => set("villageHead", v)}
                  flex
                  minCh={4}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>ชื่อกำนัน</L>
                <Dot aria-label="กำนัน" value={h.kamnan} onChange={(v) => set("kamnan", v)} flex minCh={4} />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "2mm",
                width: "100%",
                alignItems: "baseline",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>ชื่อบิดา</L>
                <Dot aria-label="บิดา" value={h.fatherName} onChange={(v) => set("fatherName", v)} flex minCh={4} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.2mm", minWidth: 0 }}>
                <L>ชื่อมารดา</L>
                <Dot aria-label="มารดา" value={h.motherName} onChange={(v) => set("motherName", v)} flex minCh={4} />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.5mm",
                width: "100%",
                minHeight: LINE,
                margin: "0 0 0.8mm",
                lineHeight: LINE,
                fontSize: BODY,
              }}
            >
              <L>เกี่ยวข้องเป็นอะไรกับคู่กรณี</L>
              <Dot
                aria-label="เกี่ยวข้อง"
                value={h.relationshipNote}
                onChange={(v) => set("relationshipNote", v)}
                flex
                minCh={8}
              />
            </div>
            <p
              style={{
                margin: "0.3mm 0 3.5mm",
                fontWeight: 700,
                fontSize: BODY,
                flexShrink: 0,
                lineHeight: LINE,
              }}
            >
              ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า
            </p>

            <LinedBody
              ariaLabel="ข้อความคำให้การ — พิมพ์ถาม ตอบ บนเส้น"
              minHeight="70mm"
              fill
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(0, t)}
              onOverflow={onOverflow}
              focusRequest={focusRequest}
            />
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * ทุกหน้าเรียงต่อกันแบบ Word — พิมพ์หมดเส้นหน้าใด ข้อความไหลไปหน้าถัดไปเอง
 * (ผู้เรียกต่อใบต่อคู่ใหม่ใน onPageOverflow เมื่อเป็นหน้าสุดท้าย)
 */
export function OfficialStatementFormDocument({
  header,
  pages,
  onHeaderChange,
  onPageTextChange,
  onPageOverflow,
  onActivePageChange,
  scrollRequest,
}: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  onHeaderChange: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  onPageTextChange: (pageIdx: number, text: string) => void;
  /** ข้อความที่ล้นจากหน้า pageIdx — ใส่ต้นหน้า pageIdx + 1 (สร้างใบต่อถ้ายังไม่มี) */
  onPageOverflow: (pageIdx: number, text: string) => void;
  onActivePageChange?: (pageIdx: number) => void;
  scrollRequest?: { page: number; nonce: number } | null;
}) {
  const [focusRequest, setFocusRequest] = useState<(QaFocusRequest & { page: number }) | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRequest) return;
    rootRef.current
      ?.querySelector(`[data-sheet-index="${scrollRequest.page}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollRequest]);

  return (
    <div ref={rootRef} className="flex flex-col gap-6 pb-8">
      {pages.map((p, i) => (
        <OfficialStatementFormSheet
          key={p.id}
          header={header}
          pages={pages}
          pageIndex={i}
          onHeaderChange={onHeaderChange}
          onPageTextChange={onPageTextChange}
          onActivate={onActivePageChange}
          focusRequest={focusRequest?.page === i ? focusRequest : null}
          onOverflow={(text, focus) => {
            onPageOverflow(i, text);
            if (focus) setFocusRequest((r) => ({ page: i + 1, ...focus, nonce: (r?.nonce ?? 0) + 1 }));
          }}
        />
      ))}
    </div>
  );
}
