"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";

/**
 * แม่แบบคำให้การ ส ๕๖-๔ — ออกแบบใหม่เป็นเอกสาร HTML (ไม่ทับพิกัด PNG)
 * พิมพ์บนจุดไข่ปลาในช่องจริง · ระยะแถวคงที่
 */

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const TITLE = "15pt";
const LINE = "6.2mm";
const STMT_LINE = "7mm";

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

function LinedBody({
  value,
  onChange,
  ariaLabel,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  minHeight: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!ref.current || focused.current) return;
    if (ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="w-full whitespace-pre-wrap break-words outline-none"
      style={{
        minHeight,
        fontSize: BODY,
        lineHeight: STMT_LINE,
        padding: "0 2mm",
        borderLeft: "0.5pt solid #111",
        borderRight: "0.5pt solid #111",
        color: "#111",
        backgroundImage: `repeating-linear-gradient(transparent 0, transparent calc(${STMT_LINE} - 0.35pt), #666 calc(${STMT_LINE} - 0.35pt), #666 ${STMT_LINE})`,
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        onChange(ref.current?.innerText ?? "");
      }}
      onInput={() => onChange(ref.current?.innerText ?? "")}
    />
  );
}

export function OfficialStatementFormSheet({
  header,
  pages,
  pageIndex,
  onHeaderChange,
  onPageTextChange,
  className,
}: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  pageIndex: number;
  formTitle?: string;
  onHeaderChange: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  onPageTextChange: (pageIdx: number, text: string) => void;
  onQaChange?: unknown;
  onAddQa?: unknown;
  onRemoveQa?: unknown;
  className?: string;
}) {
  const h = header;
  const set = onHeaderChange;
  const page = pages[pageIndex];
  const isCont = pageIndex > 0;

  return (
    <article
      className={cn("sp-a4-sheet mx-auto bg-white text-[#111] shadow-xl print:shadow-none", className)}
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        padding: "16mm 12mm 8mm 6mm",
        fontFamily: FONT,
        fontSize: BODY,
        lineHeight: 1.25,
        overflow: "hidden",
      }}
    >
      {isCont ? (
        <div className="flex h-full flex-col">
          <Row style={{ marginBottom: "3mm" }}>
            <L>ใบต่อคำให้การ ของ</L>
            <Dot aria-label="ใบต่อของ" value={h.partyName} onChange={(v) => set("partyName", v)} flex minCh={12} />
            <span style={{ marginLeft: "auto" }}>
              แผ่น <Dot value={String(pageIndex + 1)} onChange={() => {}} minCh={2} />
            </span>
          </Row>
          <LinedBody
            ariaLabel="ข้อความคำให้การหน้าต่อ"
            minHeight="250mm"
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(pageIndex, t)}
          />
          <p style={{ fontSize: "9pt", marginTop: "2mm", color: "#444" }}>(ส ๕๖ - ๖)</p>
        </div>
      ) : (
        <div
          className="grid h-full"
          style={{ gridTemplateColumns: "40mm 1fr", columnGap: "0" }}
        >
          {/* แถบซ้าย */}
          <aside
            style={{
              borderRight: "0.55pt solid #111",
              paddingRight: "2.5mm",
              fontSize: SMALL,
              lineHeight: 1.25,
              display: "flex",
              flexDirection: "column",
              gap: "2.5mm",
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
            <div>
              <div style={{ fontWeight: 700 }}>ออกเมื่อ</div>
              <Line aria-label="ออกเมื่อ" value={h.idIssuedOn} onChange={(v) => set("idIssuedOn", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>หมดอายุ</div>
              <Line aria-label="หมดอายุ" value={h.idExpiresOn} onChange={(v) => set("idExpiresOn", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>ออกให้ ณ</div>
              <Line aria-label="ออกให้ ณ" value={h.idIssuedAt} onChange={(v) => set("idIssuedAt", v)} />
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

          {/* เนื้อหาหลัก */}
          <div style={{ paddingLeft: "3.5mm", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <header style={{ textAlign: "center", marginBottom: "2.5mm" }}>
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

            <Row>
              <L>อยู่บ้านเลขที่</L>
              <Dot aria-label="บ้านเลขที่" value={h.houseNo} onChange={(v) => set("houseNo", v)} minCh={3} />
              <L>หมู่ที่</L>
              <Dot aria-label="หมู่ที่" value={h.moo} onChange={(v) => set("moo", v)} minCh={2} />
              <L>แขวง/ตำบล</L>
              <Dot aria-label="แขวงตำบล" value={h.tambon} onChange={(v) => set("tambon", v)} minCh={5} />
            </Row>
            <Row>
              <L>เขต/อำเภอ</L>
              <Dot
                aria-label="เขตอำเภอที่อยู่"
                value={h.amphoe || h.district}
                onChange={(v) => set("amphoe", v)}
                minCh={5}
              />
              <L>จังหวัด</L>
              <Dot aria-label="จังหวัดที่อยู่" value={h.province} onChange={(v) => set("province", v)} minCh={6} />
            </Row>
            <Row>
              <L>ชื่อผู้ใหญ่บ้าน</L>
              <Dot aria-label="ผู้ใหญ่บ้าน" value={h.villageHead} onChange={(v) => set("villageHead", v)} minCh={6} />
              <L>ชื่อกำนัน</L>
              <Dot aria-label="กำนัน" value={h.kamnan} onChange={(v) => set("kamnan", v)} minCh={6} />
            </Row>
            <Row>
              <L>ชื่อบิดา</L>
              <Dot aria-label="บิดา" value={h.fatherName} onChange={(v) => set("fatherName", v)} minCh={6} />
              <L>ชื่อมารดา</L>
              <Dot aria-label="มารดา" value={h.motherName} onChange={(v) => set("motherName", v)} minCh={6} />
            </Row>
            <Row>
              <L>เกี่ยวข้องเป็นอะไรกับคู่กรณี</L>
              <Dot
                aria-label="เกี่ยวข้อง"
                value={h.relationshipNote}
                onChange={(v) => set("relationshipNote", v)}
                minCh={14}
              />
            </Row>
            <p style={{ margin: "0.5mm 0 1.5mm", fontWeight: 700, fontSize: BODY }}>
              ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า
            </p>

            <LinedBody
              ariaLabel="ข้อความคำให้การ"
              minHeight="62mm"
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(0, t)}
            />
          </div>
        </div>
      )}
    </article>
  );
}
