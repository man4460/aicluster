"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";

/**
 * สัดส่วนจาก statement-complainant-template.png (1190×1683 = A4)
 * - เส้นตั้งคั่นคอลัมน์ซ้าย ≈ 47.3 มม.
 * - ขอบซ้ายเนื้อหา ≈ 6 มม. · ขวา ≈ 14 มม. · บน ≈ 14–21 มม. · ล่าง ≈ 9 มม.
 * - บรรทัดจุดไข่ปลาหน้าต่อ ≈ 8.5 มม.
 */
const PAGE_W = "210mm";
const PAGE_H = "297mm";
const LEFT_COL = "47mm";
const LINE_H = "8.5mm";
const BODY_PT = "16pt"; /* TH Sarabun New มาตรฐานราชการ */
const SMALL_PT = "14pt";
const TINY_PT = "11pt";

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

function LinedBody({
  value,
  onChange,
  ariaLabel,
  className,
  minHeight,
  bordered = true,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  className?: string;
  minHeight: string;
  bordered?: boolean;
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
        bordered && "border-x border-[#111]",
        className,
      )}
      style={{
        minHeight,
        fontSize: BODY_PT,
        lineHeight: LINE_H,
        padding: "0 2mm",
        color: "#111",
        backgroundImage: `repeating-linear-gradient(transparent 0, transparent calc(${LINE_H} - 0.35pt), #111 calc(${LINE_H} - 0.35pt), #111 ${LINE_H})`,
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
 * แบบฟอร์มราชการ — สัดส่วน A4 จริงตามแม่แบบ PNG / Word (ส ๕๖-๔)
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
        /* วัดจาก PNG: L≈6 R≈14 T≈14–21 B≈9 */
        padding: "14mm 14mm 8mm 6mm",
        fontFamily: '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif',
        fontSize: BODY_PT,
        lineHeight: "1.25",
        overflow: "hidden",
      }}
    >
      {isCont ? (
        <div className="flex h-full flex-col">
          <p
            style={{
              fontSize: BODY_PT,
              margin: "0 0 4mm",
              lineHeight: LINE_H,
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
            minHeight="250mm"
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(pageIndex, t)}
          />
          <p style={{ fontSize: TINY_PT, marginTop: "2mm", color: "#333" }}>(ส ๕๖ - ๖)</p>
        </div>
      ) : (
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: `${LEFT_COL} 1fr`,
            columnGap: "0",
          }}
        >
          {/* คอลัมน์ซ้าย — กว้างตามเส้นตั้งต้นฉบับ ≈ 47 มม. */}
          <aside
            className="relative flex flex-col"
            style={{
              borderRight: "0.6pt solid #111",
              paddingRight: "2.5mm",
              fontSize: SMALL_PT,
              lineHeight: "1.25",
              gap: "3.2mm",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>คำให้การของ</div>
              <LineFill aria-label="คำให้การของ" value={h.partyName} onChange={(v) => set("partyName", v)} />
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>เป็น</span>{" "}
              <Dot
                aria-label="เป็น"
                value={h.partyRoleLabel}
                onChange={(v) => set("partyRoleLabel", v)}
                minCh={9}
              />
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
            <p style={{ textAlign: "center", marginTop: "10mm", fontSize: SMALL_PT }}>
              <span style={{ fontWeight: 700 }}>ลงชื่อ</span>
              <span
                style={{
                  display: "inline-block",
                  minWidth: "14mm",
                  borderBottom: "0.5pt dotted #111",
                  margin: "0 1mm",
                }}
              />
              <span style={{ fontWeight: 700 }}>บันทึก</span>
            </p>
            <p style={{ marginTop: "auto", fontSize: TINY_PT, color: "#333" }}>(ส ๕๖ - ๔)</p>
          </aside>

          {/* เนื้อหาหลัก */}
          <div style={{ paddingLeft: "3.5mm", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <header style={{ textAlign: "center", marginBottom: "1.5mm" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smart-police/garuda.png"
                alt=""
                width={52}
                height={58}
                style={{ display: "block", margin: "0 auto 1mm", height: "16mm", width: "auto" }}
              />
              <p style={{ margin: 0, fontSize: "18pt", fontWeight: 700, lineHeight: 1.15 }}>
                สำนักงานตำรวจแห่งชาติ
              </p>
              <h1
                style={{
                  margin: "0.8mm 0 0",
                  fontSize: "18pt",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textDecoration: "underline",
                  textUnderlineOffset: "1.2mm",
                }}
              >
                บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน
              </h1>
            </header>

            <div style={{ fontSize: BODY_PT, lineHeight: "1.3" }}>
              <p style={{ margin: "0 0 0.8mm", textAlign: "right" }}>
                <b>สถานีตำรวจ</b>{" "}
                <Dot aria-label="สถานีตำรวจ" value={h.stationName} onChange={(v) => set("stationName", v)} minCh={10} />{" "}
                <b>เขต/อำเภอ</b>{" "}
                <Dot aria-label="เขตอำเภอสถานี" value={h.district} onChange={(v) => set("district", v)} minCh={6} />{" "}
                <b>จังหวัด</b>{" "}
                <Dot aria-label="จังหวัด" value={h.province} onChange={(v) => set("province", v)} minCh={8} />
              </p>

              <p style={{ margin: "0 0 1.2mm", textAlign: "right" }}>
                <b>วันที่</b> <Dot aria-label="วันที่" value={h.dayThai} onChange={(v) => set("dayThai", v)} minCh={2} />{" "}
                <b>เดือน</b>{" "}
                <Dot aria-label="เดือน" value={h.monthThai} onChange={(v) => set("monthThai", v)} minCh={6} />{" "}
                <b>พ.ศ.</b> <Dot aria-label="พ.ศ." value={h.yearThai} onChange={(v) => set("yearThai", v)} minCh={4} />
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto 1fr",
                  alignItems: "center",
                  columnGap: "2mm",
                  margin: "0.5mm 0 1.5mm",
                }}
              >
                <b>คดีระหว่าง</b>
                <span style={{ fontSize: "32pt", lineHeight: 0.8, fontWeight: 400 }} aria-hidden>
                  {"{"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "1mm" }}>
                  <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: "2mm" }}>
                    <LineFill
                      aria-label="ผู้กล่าวหาในคดี"
                      className="flex-1"
                      value={h.complainantLine}
                      onChange={(v) => set("complainantLine", v)}
                    />
                    <b style={{ flexShrink: 0 }}>ผู้กล่าวหา</b>
                  </p>
                  <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: "2mm" }}>
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

              <p style={{ margin: "0 0 0.8mm", display: "flex", alignItems: "baseline", gap: "2mm" }}>
                <b style={{ flexShrink: 0 }}>ต่อหน้า</b>
                <LineFill
                  aria-label="ต่อหน้า"
                  className="flex-1"
                  value={h.investigator}
                  onChange={(v) => set("investigator", v)}
                />
              </p>
              <p style={{ margin: "0 0 0.8mm" }}>
                <LineFill
                  aria-label="ต่อหน้าบรรทัด2"
                  value={h.commanderLine}
                  onChange={(v) => set("commanderLine", v)}
                />
              </p>

              <p style={{ margin: "0 0 0.8mm", display: "flex", alignItems: "baseline", gap: "2mm" }}>
                <b style={{ flexShrink: 0 }}>สอบสวนที่</b>
                <LineFill
                  aria-label="สอบสวนที่"
                  className="flex-1"
                  value={h.interviewPlace}
                  onChange={(v) => set("interviewPlace", v)}
                />
              </p>

              <p style={{ margin: "0 0 0.8mm" }}>
                <b>ชื่อ</b>{" "}
                <Dot aria-label="ชื่อ" value={h.partyName} onChange={(v) => set("partyName", v)} minCh={14} />{" "}
                <b>อายุ</b> <Dot aria-label="อายุ" value={h.partyAge} onChange={(v) => set("partyAge", v)} minCh={2} />{" "}
                ปี
              </p>

              <p style={{ margin: "0 0 0.8mm" }}>
                <b>เชื้อชาติ</b>{" "}
                <Dot aria-label="เชื้อชาติ" value={h.ethnicity} onChange={(v) => set("ethnicity", v)} minCh={5} />{" "}
                <b>สัญชาติ</b>{" "}
                <Dot
                  aria-label="สัญชาติ"
                  value={h.partyNationality}
                  onChange={(v) => set("partyNationality", v)}
                  minCh={5}
                />{" "}
                <b>ศาสนา</b>{" "}
                <Dot aria-label="ศาสนา" value={h.religion} onChange={(v) => set("religion", v)} minCh={5} />
              </p>

              <p style={{ margin: "0 0 0.3mm", display: "flex", alignItems: "baseline", gap: "2mm" }}>
                <b style={{ flexShrink: 0 }}>อาชีพ</b>
                <LineFill
                  aria-label="อาชีพ"
                  className="flex-1"
                  value={h.partyOccupation}
                  onChange={(v) => set("partyOccupation", v)}
                />
              </p>
              <p style={{ margin: "0 0 1mm", fontSize: TINY_PT, lineHeight: 1.2 }}>
                (ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด หรือบำเหน็จ บำนาญ
                หรือไม่ ให้ลงตามประเภทที่รับ)
              </p>

              <p style={{ margin: "0 0 0.8mm" }}>
                <b>อยู่บ้านเลขที่</b>{" "}
                <Dot aria-label="บ้านเลขที่" value={h.houseNo} onChange={(v) => set("houseNo", v)} minCh={4} />{" "}
                <b>หมู่ที่</b> <Dot aria-label="หมู่ที่" value={h.moo} onChange={(v) => set("moo", v)} minCh={2} />{" "}
                <b>แขวง/ตำบล</b>{" "}
                <Dot aria-label="แขวงตำบล" value={h.tambon} onChange={(v) => set("tambon", v)} minCh={6} />
              </p>
              <p style={{ margin: "0 0 0.8mm" }}>
                <b>เขต/อำเภอ</b>{" "}
                <Dot
                  aria-label="เขตอำเภอที่อยู่"
                  value={h.amphoe || h.district}
                  onChange={(v) => set("amphoe", v)}
                  minCh={6}
                />{" "}
                <b>จังหวัด</b>{" "}
                <Dot aria-label="จังหวัดที่อยู่" value={h.province} onChange={(v) => set("province", v)} minCh={6} />
              </p>

              <p style={{ margin: "0 0 0.8mm" }}>
                <b>ชื่อผู้ใหญ่บ้าน</b>{" "}
                <Dot
                  aria-label="ชื่อผู้ใหญ่บ้าน"
                  value={h.villageHead}
                  onChange={(v) => set("villageHead", v)}
                  minCh={7}
                />{" "}
                <b>ชื่อกำนัน</b>{" "}
                <Dot aria-label="ชื่อกำนัน" value={h.kamnan} onChange={(v) => set("kamnan", v)} minCh={7} />
              </p>
              <p style={{ margin: "0 0 0.8mm" }}>
                <b>ชื่อบิดา</b>{" "}
                <Dot aria-label="ชื่อบิดา" value={h.fatherName} onChange={(v) => set("fatherName", v)} minCh={7} />{" "}
                <b>ชื่อมารดา</b>{" "}
                <Dot aria-label="ชื่อมารดา" value={h.motherName} onChange={(v) => set("motherName", v)} minCh={7} />
              </p>

              <p style={{ margin: "0 0 1mm" }}>
                <b>เกี่ยวข้องเป็นอะไรกับคู่กรณี</b>{" "}
                <Dot
                  aria-label="เกี่ยวข้องกับคู่กรณี"
                  value={h.relationshipNote}
                  onChange={(v) => set("relationshipNote", v)}
                  minCh={18}
                />
              </p>

              <p style={{ margin: "0 0 1mm", fontWeight: 700 }}>
                ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า
              </p>
            </div>

            {/* โซนคำให้การ — เติมพื้นที่ล่างเหมือนต้นฉบับ (ไม่มีกล่องลายเซ็นท้ายหน้า 1) */}
            <LinedBody
              ariaLabel="ข้อความคำให้การ"
              className="mt-auto flex-1"
              minHeight="72mm"
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(0, t)}
            />
          </div>
        </div>
      )}
    </article>
  );
}
