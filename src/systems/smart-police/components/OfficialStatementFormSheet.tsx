"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";

const PAGE1_BG = "/smart-police/statement-complainant-template.png";
const CONT_BG = "/smart-police/statement-continuation-template.png";

/** ช่องพิมพ์โปร่งใส — ไม่มีกล่อง เหมือนพิมพ์บน Word */
function WordField({
  value,
  onChange,
  className,
  style,
  "aria-label": ariaLabel,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  multiline?: boolean;
}) {
  const common = cn(
    "absolute z-[2] m-0 border-0 bg-transparent p-0 font-['TH_Sarabun_New','Sarabun','Cordia_New',Tahoma,sans-serif]",
    "text-[13.5px] leading-[1.35] text-[#111] outline-none caret-[#111]",
    "focus:bg-[#fff8c5]/35",
    className,
  );
  if (multiline) {
    return (
      <textarea
        aria-label={ariaLabel}
        className={cn(common, "resize-none overflow-hidden")}
        style={style}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    );
  }
  return (
    <input
      aria-label={ariaLabel}
      className={common}
      style={style}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
}

function BodyEditor({
  value,
  onChange,
  className,
  style,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    if (!seeded.current || document.activeElement !== ref.current) {
      if (ref.current.innerText !== value) {
        ref.current.innerText = value;
      }
      seeded.current = true;
    }
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
        "absolute z-[2] overflow-hidden whitespace-pre-wrap break-words outline-none",
        "font-['TH_Sarabun_New','Sarabun','Cordia_New',Tahoma,sans-serif]",
        "text-[13.5px] leading-[22px] text-[#111] caret-[#111]",
        "focus:bg-[#fff8c5]/25",
        className,
      )}
      style={style}
      onInput={() => {
        onChange(ref.current?.innerText ?? "");
      }}
    />
  );
}

/**
 * แบบฟอร์มราชการใกล้ 100% — พื้นหลัง PNG จาก Word จริง
 * พิมพ์ทับจุดไข่ปลาแบบ Word (ไม่มีกล่อง) · หน้า 2+ เป็นใบต่อ
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
  /** @deprecated ไม่ใช้กล่องถาม–ตอบแล้ว */
  onQaChange?: unknown;
  onAddQa?: unknown;
  onRemoveQa?: unknown;
  className?: string;
}) {
  const h = header;
  const page = pages[pageIndex];
  const isCont = pageIndex > 0;
  const bg = isCont ? CONT_BG : PAGE1_BG;

  return (
    <article
      className={cn(
        "relative mx-auto aspect-[210/297] w-full max-w-[210mm] overflow-hidden bg-white shadow-xl",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      {isCont ? (
        <>
          {/* หัวใบต่อ — ชื่อผู้ให้การ + แผ่น */}
          <WordField
            aria-label="ใบต่อของ"
            className="text-[12px]"
            style={{ left: "18%", top: "3.2%", width: "42%", height: "2.2%" }}
            value={h.partyName}
            onChange={(v) => onHeaderChange("partyName", v)}
          />
          <WordField
            aria-label="แผ่นที่"
            className="text-[12px] text-center"
            style={{ left: "78%", top: "3.2%", width: "10%", height: "2.2%" }}
            value={String(pageIndex + 1)}
            onChange={() => {}}
          />
          <BodyEditor
            ariaLabel="ข้อความคำให้การหน้าต่อ"
            style={{ left: "8%", top: "7.5%", width: "78%", height: "86%" }}
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(pageIndex, t)}
          />
        </>
      ) : (
        <>
          {/* —— แถบซ้าย —— */}
          <WordField
            aria-label="คำให้การของ"
            style={{ left: "3.5%", top: "11.5%", width: "18%", height: "2.4%" }}
            value={h.partyName}
            onChange={(v) => onHeaderChange("partyName", v)}
          />
          <WordField
            aria-label="เป็น"
            style={{ left: "8%", top: "16.8%", width: "14%", height: "2.2%" }}
            value={h.partyRoleLabel}
            onChange={(v) => onHeaderChange("partyRoleLabel", v)}
          />
          <WordField
            aria-label="หมายเลขโทรศัพท์"
            style={{ left: "3.5%", top: "22.5%", width: "18%", height: "2.2%" }}
            value={h.partyPhone}
            onChange={(v) => onHeaderChange("partyPhone", v)}
          />
          <WordField
            aria-label="บัตรประจำตัวประชาชน"
            style={{ left: "3.5%", top: "28.5%", width: "18%", height: "2.2%" }}
            value={h.partyIdCard}
            onChange={(v) => onHeaderChange("partyIdCard", v)}
          />
          <WordField
            aria-label="ออกเมื่อ"
            style={{ left: "3.5%", top: "33.5%", width: "18%", height: "2%" }}
            value={h.idIssuedOn}
            onChange={(v) => onHeaderChange("idIssuedOn", v)}
          />
          <WordField
            aria-label="หมดอายุ"
            style={{ left: "3.5%", top: "36.8%", width: "18%", height: "2%" }}
            value={h.idExpiresOn}
            onChange={(v) => onHeaderChange("idExpiresOn", v)}
          />
          <WordField
            aria-label="ออกให้ ณ"
            style={{ left: "3.5%", top: "40%", width: "18%", height: "2%" }}
            value={h.idIssuedAt}
            onChange={(v) => onHeaderChange("idIssuedAt", v)}
          />

          {/* —— เนื้อหาหลัก —— */}
          <WordField
            aria-label="สถานีตำรวจ"
            style={{ left: "34%", top: "18.8%", width: "22%", height: "2.1%" }}
            value={h.stationName}
            onChange={(v) => onHeaderChange("stationName", v)}
          />
          <WordField
            aria-label="เขตอำเภอสถานี"
            style={{ left: "64%", top: "18.8%", width: "14%", height: "2.1%" }}
            value={h.district}
            onChange={(v) => onHeaderChange("district", v)}
          />
          <WordField
            aria-label="จังหวัด"
            style={{ left: "84%", top: "18.8%", width: "12%", height: "2.1%" }}
            value={h.province}
            onChange={(v) => onHeaderChange("province", v)}
          />

          <WordField
            aria-label="วันที่"
            style={{ left: "30%", top: "21.5%", width: "8%", height: "2%" }}
            value={h.dayThai}
            onChange={(v) => onHeaderChange("dayThai", v)}
          />
          <WordField
            aria-label="เดือน"
            style={{ left: "44%", top: "21.5%", width: "18%", height: "2%" }}
            value={h.monthThai}
            onChange={(v) => onHeaderChange("monthThai", v)}
          />
          <WordField
            aria-label="พ.ศ."
            style={{ left: "72%", top: "21.5%", width: "12%", height: "2%" }}
            value={h.yearThai}
            onChange={(v) => onHeaderChange("yearThai", v)}
          />

          <WordField
            aria-label="ผู้กล่าวหาในคดี"
            style={{ left: "38%", top: "25.2%", width: "40%", height: "2%" }}
            value={h.complainantLine}
            onChange={(v) => onHeaderChange("complainantLine", v)}
          />
          <WordField
            aria-label="ผู้ต้องหาในคดี"
            style={{ left: "38%", top: "27.8%", width: "40%", height: "2%" }}
            value={h.suspectLine}
            onChange={(v) => onHeaderChange("suspectLine", v)}
          />

          <WordField
            aria-label="ต่อหน้า"
            style={{ left: "32%", top: "31%", width: "62%", height: "2%" }}
            value={h.investigator}
            onChange={(v) => onHeaderChange("investigator", v)}
          />
          <WordField
            aria-label="ต่อหน้าบรรทัด2"
            style={{ left: "26%", top: "33.5%", width: "68%", height: "2%" }}
            value={h.commanderLine}
            onChange={(v) => onHeaderChange("commanderLine", v)}
          />

          <WordField
            aria-label="สอบสวนที่"
            style={{ left: "34%", top: "38.2%", width: "60%", height: "2%" }}
            value={h.interviewPlace}
            onChange={(v) => onHeaderChange("interviewPlace", v)}
          />

          <WordField
            aria-label="ชื่อ"
            style={{ left: "30%", top: "41%", width: "42%", height: "2%" }}
            value={h.partyName}
            onChange={(v) => onHeaderChange("partyName", v)}
          />
          <WordField
            aria-label="อายุ"
            style={{ left: "80%", top: "41%", width: "8%", height: "2%" }}
            value={h.partyAge}
            onChange={(v) => onHeaderChange("partyAge", v)}
          />

          <WordField
            aria-label="เชื้อชาติ"
            style={{ left: "32%", top: "43.8%", width: "14%", height: "2%" }}
            value={h.ethnicity}
            onChange={(v) => onHeaderChange("ethnicity", v)}
          />
          <WordField
            aria-label="สัญชาติ"
            style={{ left: "56%", top: "43.8%", width: "12%", height: "2%" }}
            value={h.partyNationality}
            onChange={(v) => onHeaderChange("partyNationality", v)}
          />
          <WordField
            aria-label="ศาสนา"
            style={{ left: "78%", top: "43.8%", width: "14%", height: "2%" }}
            value={h.religion}
            onChange={(v) => onHeaderChange("religion", v)}
          />

          <WordField
            aria-label="อาชีพ"
            style={{ left: "30%", top: "46.5%", width: "64%", height: "2%" }}
            value={h.partyOccupation}
            onChange={(v) => onHeaderChange("partyOccupation", v)}
          />

          <WordField
            aria-label="บ้านเลขที่"
            style={{ left: "36%", top: "51.5%", width: "10%", height: "2%" }}
            value={h.houseNo}
            onChange={(v) => onHeaderChange("houseNo", v)}
          />
          <WordField
            aria-label="หมู่ที่"
            style={{ left: "54%", top: "51.5%", width: "8%", height: "2%" }}
            value={h.moo}
            onChange={(v) => onHeaderChange("moo", v)}
          />
          <WordField
            aria-label="แขวงตำบล"
            style={{ left: "72%", top: "51.5%", width: "20%", height: "2%" }}
            value={h.tambon}
            onChange={(v) => onHeaderChange("tambon", v)}
          />

          <WordField
            aria-label="เขตอำเภอที่อยู่"
            style={{ left: "34%", top: "54.2%", width: "24%", height: "2%" }}
            value={h.amphoe || h.district}
            onChange={(v) => onHeaderChange("amphoe", v)}
          />
          <WordField
            aria-label="จังหวัดที่อยู่"
            style={{ left: "68%", top: "54.2%", width: "24%", height: "2%" }}
            value={h.province}
            onChange={(v) => onHeaderChange("province", v)}
          />

          <WordField
            aria-label="ชื่อผู้ใหญ่บ้าน"
            style={{ left: "36%", top: "56.8%", width: "24%", height: "2%" }}
            value={h.villageHead}
            onChange={(v) => onHeaderChange("villageHead", v)}
          />
          <WordField
            aria-label="ชื่อกำนัน"
            style={{ left: "70%", top: "56.8%", width: "22%", height: "2%" }}
            value={h.kamnan}
            onChange={(v) => onHeaderChange("kamnan", v)}
          />

          <WordField
            aria-label="ชื่อบิดา"
            style={{ left: "32%", top: "59.5%", width: "26%", height: "2%" }}
            value={h.fatherName}
            onChange={(v) => onHeaderChange("fatherName", v)}
          />
          <WordField
            aria-label="ชื่อมารดา"
            style={{ left: "68%", top: "59.5%", width: "24%", height: "2%" }}
            value={h.motherName}
            onChange={(v) => onHeaderChange("motherName", v)}
          />

          <WordField
            aria-label="เกี่ยวข้องกับคู่กรณี"
            style={{ left: "48%", top: "62.2%", width: "44%", height: "2%" }}
            value={h.relationshipNote}
            onChange={(v) => onHeaderChange("relationshipNote", v)}
          />

          {/* โซนคำให้การ — พิมพ์ต่อเนื่องบนบรรทัดจุดไข่ปลา */}
          <BodyEditor
            ariaLabel="ข้อความคำให้การ"
            style={{ left: "26%", top: "67.5%", width: "68%", height: "26%" }}
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(0, t)}
          />
        </>
      )}
    </article>
  );
}
