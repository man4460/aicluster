"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";

/**
 * หน้า 1 ตามแบบ ส ๕๖-๔ (ต้นฉบับผู้ใช้)
 * — ตัวอักษรเล็ก · แถวแน่น · พอดี A4
 */
const PAGE_W = "210mm";
const PAGE_H = "297mm";
const LEFT_COL = "42mm";
/** บรรทัดจุดไข่ปลาโซนคำให้การ */
const STMT_LINE = "7.2mm";
const BODY = "12.5pt";
const TITLE = "14pt";
const SIDE = "11pt";
const NOTE = "9.5pt";
const FOOT = "9pt";

const rowStyle: CSSProperties = {
  margin: "0 0 0.35mm",
  lineHeight: "5.8mm",
  fontSize: BODY,
};

/** พิมพ์บนจุดไข่ปลา — ไม่มีกล่อง */
function Dot({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  minCh = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  "aria-label"?: string;
  minCh?: number;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field inline align-baseline", className)}
      style={{
        minWidth: `${minCh}ch`,
        width: `${Math.max(minCh, (value || "").length + 1)}ch`,
        fontSize: "inherit",
        lineHeight: "inherit",
      }}
    />
  );
}

function LineFill({
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field w-full min-w-0", className)}
      style={{ fontSize: "inherit", lineHeight: "inherit" }}
    />
  );
}

function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ ...rowStyle, ...style }}>{children}</p>;
}

function LinedBody({
  value,
  onChange,
  ariaLabel,
  className,
  minHeight,
  fontSize = BODY,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  className?: string;
  minHeight: string;
  fontSize?: string;
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
      className={cn(
        "w-full whitespace-pre-wrap break-words outline-none focus:outline-none",
        "border-x border-[#111]",
        className,
      )}
      style={{
        minHeight,
        fontSize,
        lineHeight: STMT_LINE,
        padding: "0 1.5mm",
        color: "#111",
        backgroundImage: `repeating-linear-gradient(transparent 0, transparent calc(${STMT_LINE} - 0.3pt), #555 calc(${STMT_LINE} - 0.3pt), #555 ${STMT_LINE})`,
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

/**
 * แบบฟอร์มราชการ — หน้า 1 ตามต้นฉบับ ส ๕๖-๔ · หน้าต่อ ส ๕๖-๖
 */
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
  const page = pages[pageIndex];
  const isCont = pageIndex > 0;
  const set = onHeaderChange;

  return (
    <article
      className={cn("sp-a4-sheet mx-auto bg-white text-[#111] shadow-xl print:shadow-none", className)}
      style={{
        width: PAGE_W,
        height: PAGE_H,
        boxSizing: "border-box",
        padding: "10mm 12mm 7mm 5mm",
        fontFamily: '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif',
        fontSize: BODY,
        lineHeight: "1.2",
        overflow: "hidden",
        border: "0.6pt solid #111",
      }}
    >
      {isCont ? (
        <div className="flex h-full flex-col" style={{ border: "none" }}>
          <p
            style={{
              fontSize: BODY,
              margin: "0 0 3mm",
              lineHeight: STMT_LINE,
              display: "flex",
              alignItems: "baseline",
              gap: "2mm",
            }}
          >
            <span style={{ flexShrink: 0 }}>ใบต่อคำให้การ ของ</span>
            <span className="min-w-0 flex-1">
              <LineFill aria-label="ใบต่อของ" value={h.partyName} onChange={(v) => set("partyName", v)} />
            </span>
            <span style={{ flexShrink: 0, marginLeft: "4mm" }}>
              แผ่น <Dot value={String(pageIndex + 1)} onChange={() => {}} minCh={2} />
            </span>
          </p>
          <LinedBody
            ariaLabel="ข้อความคำให้การหน้าต่อ"
            className="flex-1"
            minHeight="252mm"
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(pageIndex, t)}
          />
          <p style={{ fontSize: FOOT, marginTop: "1.5mm", color: "#333" }}>(ส ๕๖ - ๖)</p>
        </div>
      ) : (
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: `${LEFT_COL} 1fr`,
            columnGap: "0",
          }}
        >
          {/* แถบซ้าย */}
          <aside
            className="relative flex flex-col"
            style={{
              borderRight: "0.55pt solid #111",
              paddingRight: "2mm",
              fontSize: SIDE,
              lineHeight: "1.2",
              gap: "2.2mm",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>คำให้การของ</div>
              <LineFill aria-label="คำให้การของ" value={h.partyName} onChange={(v) => set("partyName", v)} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "1mm" }}>
              <span style={{ fontWeight: 700 }}>เป็น</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  minWidth: "18mm",
                  borderBottom: "0.45pt dotted #111",
                  padding: "0 1mm",
                }}
              >
                <Dot
                  aria-label="เป็น"
                  value={h.partyRoleLabel}
                  onChange={(v) => set("partyRoleLabel", v)}
                  minCh={6}
                />
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>หมายเลขโทรศัพท์</div>
              <LineFill aria-label="หมายเลขโทรศัพท์" value={h.partyPhone} onChange={(v) => set("partyPhone", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>บัตรประจำตัวประชาชน</div>
              <LineFill
                aria-label="บัตรประจำตัวประชาชน"
                value={h.partyIdCard}
                onChange={(v) => set("partyIdCard", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>ออกเมื่อ</div>
              <LineFill aria-label="ออกเมื่อ" value={h.idIssuedOn} onChange={(v) => set("idIssuedOn", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>หมดอายุ</div>
              <LineFill aria-label="หมดอายุ" value={h.idExpiresOn} onChange={(v) => set("idExpiresOn", v)} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>ออกให้ ณ</div>
              <LineFill aria-label="ออกให้ ณ" value={h.idIssuedAt} onChange={(v) => set("idIssuedAt", v)} />
            </div>
            <p style={{ textAlign: "center", marginTop: "6mm", fontSize: SIDE }}>
              <span style={{ fontWeight: 700 }}>ลงชื่อ</span>
              <span
                style={{
                  display: "inline-block",
                  minWidth: "12mm",
                  borderBottom: "0.45pt dotted #111",
                  margin: "0 1mm",
                }}
              />
              <span style={{ fontWeight: 700 }}>บันทึก</span>
            </p>
            <p style={{ marginTop: "auto", fontSize: FOOT, color: "#333" }}>(ส ๕๖ - ๔)</p>
          </aside>

          {/* เนื้อหาหลัก */}
          <div style={{ paddingLeft: "3mm", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <header style={{ textAlign: "center", marginBottom: "1mm" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smart-police/garuda.png"
                alt=""
                width={40}
                height={45}
                style={{ display: "block", margin: "0 auto 0.4mm", height: "11mm", width: "auto" }}
              />
              <p style={{ margin: 0, fontSize: TITLE, fontWeight: 700, lineHeight: 1.1 }}>สำนักงานตำรวจแห่งชาติ</p>
              <h1
                style={{
                  margin: "0.4mm 0 0",
                  fontSize: TITLE,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  textDecoration: "underline",
                  textUnderlineOffset: "0.8mm",
                }}
              >
                บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน
              </h1>
            </header>

            <div>
              <Row>
                <b>สถานีตำรวจ</b>{" "}
                <Dot aria-label="สถานีตำรวจ" value={h.stationName} onChange={(v) => set("stationName", v)} minCh={8} />{" "}
                <b>เขต/อำเภอ</b>{" "}
                <Dot aria-label="เขตอำเภอสถานี" value={h.district} onChange={(v) => set("district", v)} minCh={5} />{" "}
                <b>จังหวัด</b>{" "}
                <Dot aria-label="จังหวัด" value={h.province} onChange={(v) => set("province", v)} minCh={7} />
              </Row>

              <Row>
                <b>วันที่</b> <Dot aria-label="วันที่" value={h.dayThai} onChange={(v) => set("dayThai", v)} minCh={2} />{" "}
                <b>เดือน</b>{" "}
                <Dot aria-label="เดือน" value={h.monthThai} onChange={(v) => set("monthThai", v)} minCh={5} />{" "}
                <b>พ.ศ.</b> <Dot aria-label="พ.ศ." value={h.yearThai} onChange={(v) => set("yearThai", v)} minCh={4} />
              </Row>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto 1fr",
                  alignItems: "center",
                  columnGap: "1.5mm",
                  margin: "0.4mm 0 0.6mm",
                }}
              >
                <b style={{ fontSize: BODY }}>คดีระหว่าง</b>
                <span style={{ fontSize: "22pt", lineHeight: 0.75, fontWeight: 400 }} aria-hidden>
                  {"{"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3mm" }}>
                  <p style={{ ...rowStyle, margin: 0, display: "flex", alignItems: "baseline", gap: "1.5mm" }}>
                    <LineFill
                      aria-label="ผู้กล่าวหาในคดี"
                      className="flex-1"
                      value={h.complainantLine}
                      onChange={(v) => set("complainantLine", v)}
                    />
                    <b style={{ flexShrink: 0 }}>ผู้กล่าวหา</b>
                  </p>
                  <p style={{ ...rowStyle, margin: 0, display: "flex", alignItems: "baseline", gap: "1.5mm" }}>
                    <LineFill
                      aria-label="ผู้ต้องหาในคดี"
                      className="flex-1"
                      value={h.suspectLine}
                      onChange={(v) => set("suspectLine", v)}
                    />
                    <b style={{ flexShrink: 0 }}>ผู้ต้องหา</b>
                  </p>
                </div>
              </div>

              <Row style={{ display: "flex", alignItems: "baseline", gap: "1.5mm" }}>
                <b style={{ flexShrink: 0 }}>ต่อหน้า</b>
                <LineFill
                  aria-label="ต่อหน้า"
                  className="flex-1"
                  value={h.investigator}
                  onChange={(v) => set("investigator", v)}
                />
              </Row>
              <Row>
                <LineFill
                  aria-label="ต่อหน้าบรรทัด2"
                  value={h.commanderLine}
                  onChange={(v) => set("commanderLine", v)}
                />
              </Row>

              <Row style={{ display: "flex", alignItems: "baseline", gap: "1.5mm" }}>
                <b style={{ flexShrink: 0 }}>สอบสวนที่</b>
                <LineFill
                  aria-label="สอบสวนที่"
                  className="flex-1"
                  value={h.interviewPlace}
                  onChange={(v) => set("interviewPlace", v)}
                />
              </Row>

              <Row>
                <b>ชื่อ</b>{" "}
                <Dot aria-label="ชื่อ" value={h.partyName} onChange={(v) => set("partyName", v)} minCh={12} />{" "}
                <b>อายุ</b> <Dot aria-label="อายุ" value={h.partyAge} onChange={(v) => set("partyAge", v)} minCh={2} />{" "}
                ปี
              </Row>

              <Row>
                <b>เชื้อชาติ</b>{" "}
                <Dot aria-label="เชื้อชาติ" value={h.ethnicity} onChange={(v) => set("ethnicity", v)} minCh={4} />{" "}
                <b>สัญชาติ</b>{" "}
                <Dot
                  aria-label="สัญชาติ"
                  value={h.partyNationality}
                  onChange={(v) => set("partyNationality", v)}
                  minCh={4}
                />{" "}
                <b>ศาสนา</b>{" "}
                <Dot aria-label="ศาสนา" value={h.religion} onChange={(v) => set("religion", v)} minCh={4} />
              </Row>

              {/* อาชีพ + คำอธิบายในวงเล็บแบบต้นฉบับ (ห่อ 2 แถว) */}
              <Row style={{ display: "flex", alignItems: "baseline", gap: "1.5mm" }}>
                <b style={{ flexShrink: 0 }}>อาชีพ</b>
                <LineFill
                  aria-label="อาชีพ"
                  className="flex-1"
                  value={h.partyOccupation}
                  onChange={(v) => set("partyOccupation", v)}
                />
              </Row>
              <p
                style={{
                  margin: "0 0 0.5mm",
                  fontSize: NOTE,
                  lineHeight: "4.2mm",
                  color: "#222",
                }}
              >
                (ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด หรือบำเหน็จ บำนาญ
                หรือไม่ ให้ลงตามประเภทที่รับ)
              </p>

              <Row>
                <b>อยู่บ้านเลขที่</b>{" "}
                <Dot aria-label="บ้านเลขที่" value={h.houseNo} onChange={(v) => set("houseNo", v)} minCh={3} />{" "}
                <b>หมู่ที่</b> <Dot aria-label="หมู่ที่" value={h.moo} onChange={(v) => set("moo", v)} minCh={2} />{" "}
                <b>แขวง/ตำบล</b>{" "}
                <Dot aria-label="แขวงตำบล" value={h.tambon} onChange={(v) => set("tambon", v)} minCh={5} />
              </Row>
              <Row>
                <b>เขต/อำเภอ</b>{" "}
                <Dot
                  aria-label="เขตอำเภอที่อยู่"
                  value={h.amphoe || h.district}
                  onChange={(v) => set("amphoe", v)}
                  minCh={5}
                />{" "}
                <b>จังหวัด</b>{" "}
                <Dot aria-label="จังหวัดที่อยู่" value={h.province} onChange={(v) => set("province", v)} minCh={5} />
              </Row>

              <Row>
                <b>ชื่อผู้ใหญ่บ้าน</b>{" "}
                <Dot
                  aria-label="ชื่อผู้ใหญ่บ้าน"
                  value={h.villageHead}
                  onChange={(v) => set("villageHead", v)}
                  minCh={6}
                />{" "}
                <b>ชื่อกำนัน</b>{" "}
                <Dot aria-label="ชื่อกำนัน" value={h.kamnan} onChange={(v) => set("kamnan", v)} minCh={6} />
              </Row>
              <Row>
                <b>ชื่อบิดา</b>{" "}
                <Dot aria-label="ชื่อบิดา" value={h.fatherName} onChange={(v) => set("fatherName", v)} minCh={6} />{" "}
                <b>ชื่อมารดา</b>{" "}
                <Dot aria-label="ชื่อมารดา" value={h.motherName} onChange={(v) => set("motherName", v)} minCh={6} />
              </Row>

              <Row>
                <b>เกี่ยวข้องเป็นอะไรกับคู่กรณี</b>{" "}
                <Dot
                  aria-label="เกี่ยวข้องกับคู่กรณี"
                  value={h.relationshipNote}
                  onChange={(v) => set("relationshipNote", v)}
                  minCh={16}
                />
              </Row>

              <Row style={{ fontWeight: 700, marginBottom: "0.8mm" }}>
                ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า
              </Row>
            </div>

            <LinedBody
              ariaLabel="ข้อความคำให้การ"
              className="mt-auto flex-1"
              minHeight="78mm"
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(0, t)}
            />
          </div>
        </div>
      )}
    </article>
  );
}
