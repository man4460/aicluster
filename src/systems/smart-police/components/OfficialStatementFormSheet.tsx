"use client";

import { cn } from "@/lib/cn";
import type {
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
} from "@/lib/smart-police/form-templates";

function DotInput({
  value,
  onChange,
  className,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className={cn(
        "border-0 border-b border-dotted border-[#333] bg-transparent px-0.5 pb-0.5 font-[inherit] text-[inherit] outline-none focus:border-[#5b61ff]",
        className,
      )}
      value={value}
      placeholder={placeholder ?? "………………"}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function OfficialStatementFormSheet({
  header,
  pages,
  pageIndex,
  formTitle,
  onHeaderChange,
  onQaChange,
  onAddQa,
  onRemoveQa,
  className,
}: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  pageIndex: number;
  formTitle: string;
  onHeaderChange: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  onQaChange: (pageIdx: number, qaIdx: number, field: keyof StatementQaItem, value: string) => void;
  onAddQa: () => void;
  onRemoveQa: (qaIdx: number) => void;
  className?: string;
}) {
  const h = header;
  const page = pages[pageIndex];
  let qaOffset = 0;
  for (let i = 0; i < pageIndex; i++) qaOffset += pages[i]?.qa.length ?? 0;

  return (
    <article
      className={cn(
        "mx-auto w-full max-w-[210mm] bg-white px-[12mm] py-[10mm] text-[#111] shadow-xl",
        "font-['TH_Sarabun_New','Sarabun','Cordia_New',Tahoma,sans-serif] text-[15px] leading-snug",
        className,
      )}
    >
      <header className="mb-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smart-police/garuda.svg"
          alt=""
          width={52}
          height={60}
          className="mx-auto mb-1 h-[52px] w-auto"
        />
        <p className="m-0 text-[15px] font-bold">สำนักงานตำรวจแห่งชาติ</p>
        <h1 className="mt-1 text-[17px] font-bold underline decoration-1 underline-offset-[3px]">
          {formTitle || "บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน"}
        </h1>
      </header>

      <div className="grid min-h-[200mm] grid-cols-1 border-t border-[#222] sm:grid-cols-[58mm_1fr]">
        {/* แถบซ้าย */}
        <aside className="space-y-3 border-[#222] py-2 pr-2 text-[14px] sm:border-r sm:pr-3">
          <div>
            <span className="font-bold">คำให้การของ</span>
            <DotInput
              aria-label="คำให้การของ"
              className="mt-0.5 w-full"
              value={h.partyName}
              onChange={(v) => onHeaderChange("partyName", v)}
            />
          </div>
          <div>
            <span className="font-bold">เป็น</span>
            <DotInput
              aria-label="เป็น"
              className="mt-0.5 w-full"
              value={h.partyRoleLabel}
              onChange={(v) => onHeaderChange("partyRoleLabel", v)}
            />
          </div>
          <div>
            <span className="font-bold">หมายเลขโทรศัพท์</span>
            <DotInput
              aria-label="หมายเลขโทรศัพท์"
              className="mt-0.5 w-full"
              value={h.partyPhone}
              onChange={(v) => onHeaderChange("partyPhone", v)}
            />
          </div>
          <div>
            <span className="font-bold">บัตรประจำตัวประชาชน</span>
            <DotInput
              aria-label="บัตรประจำตัวประชาชน"
              className="mt-0.5 w-full"
              value={h.partyIdCard}
              onChange={(v) => onHeaderChange("partyIdCard", v)}
            />
          </div>
          <div>
            <span className="font-bold">ออกเมื่อ</span>
            <DotInput
              aria-label="ออกเมื่อ"
              className="mt-0.5 w-full"
              value={h.idIssuedOn}
              onChange={(v) => onHeaderChange("idIssuedOn", v)}
            />
          </div>
          <div>
            <span className="font-bold">หมดอายุ</span>
            <DotInput
              aria-label="หมดอายุ"
              className="mt-0.5 w-full"
              value={h.idExpiresOn}
              onChange={(v) => onHeaderChange("idExpiresOn", v)}
            />
          </div>
          <div>
            <span className="font-bold">ออกให้ ณ</span>
            <DotInput
              aria-label="ออกให้ ณ"
              className="mt-0.5 w-full"
              value={h.idIssuedAt}
              onChange={(v) => onHeaderChange("idIssuedAt", v)}
            />
          </div>
          <div className="pt-4 text-center text-[13px]">
            <p className="mb-1">
              <span className="font-bold">ลงชื่อ</span>
              <span className="mx-1 inline-block min-w-[4rem] border-b border-dotted border-[#333]" />
              <span className="font-bold">บันทึก</span>
            </p>
          </div>
        </aside>

        {/* เนื้อหาหลัก */}
        <div className="space-y-2 py-2 pl-0 sm:pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-bold">สถานีตำรวจ</span>
            <DotInput
              aria-label="สถานีตำรวจ"
              className="min-w-[8rem] flex-1"
              value={h.stationName}
              onChange={(v) => onHeaderChange("stationName", v)}
            />
            <span className="font-bold">เขต/อำเภอ</span>
            <DotInput
              aria-label="เขตอำเภอสถานี"
              className="min-w-[5rem] flex-1"
              value={h.district}
              onChange={(v) => onHeaderChange("district", v)}
            />
            <span className="font-bold">จังหวัด</span>
            <DotInput
              aria-label="จังหวัด"
              className="min-w-[5rem] flex-1"
              value={h.province}
              onChange={(v) => onHeaderChange("province", v)}
            />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-bold">วันที่</span>
            <DotInput
              aria-label="วันที่"
              className="w-12"
              value={h.dayThai}
              onChange={(v) => onHeaderChange("dayThai", v)}
            />
            <span className="font-bold">เดือน</span>
            <DotInput
              aria-label="เดือน"
              className="min-w-[5rem] flex-1"
              value={h.monthThai}
              onChange={(v) => onHeaderChange("monthThai", v)}
            />
            <span className="font-bold">พ.ศ.</span>
            <DotInput
              aria-label="พ.ศ."
              className="w-16"
              value={h.yearThai}
              onChange={(v) => onHeaderChange("yearThai", v)}
            />
          </div>

          <div className="my-2 grid grid-cols-[auto_auto_1fr] items-center gap-x-2">
            <span className="font-bold">คดีระหว่าง</span>
            <span className="select-none text-[40px] leading-none text-[#222]" aria-hidden>
              {"{"}
            </span>
            <div className="flex flex-col gap-2 py-1">
              <div className="flex items-baseline gap-2">
                <DotInput
                  aria-label="ชื่อผู้กล่าวหาในคดี"
                  className="min-w-0 flex-1"
                  value={h.complainantLine}
                  onChange={(v) => onHeaderChange("complainantLine", v)}
                />
                <span className="shrink-0 font-bold">ผู้กล่าวหา</span>
              </div>
              <div className="flex items-baseline gap-2">
                <DotInput
                  aria-label="ชื่อผู้ต้องหาในคดี"
                  className="min-w-0 flex-1"
                  value={h.suspectLine}
                  onChange={(v) => onHeaderChange("suspectLine", v)}
                />
                <span className="shrink-0 font-bold">ผู้ต้องหา</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">ต่อหน้า</span>
            <DotInput
              aria-label="ต่อหน้า"
              className="min-w-0 flex-1"
              value={h.investigator}
              onChange={(v) => onHeaderChange("investigator", v)}
            />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">สอบสวนที่</span>
            <DotInput
              aria-label="สอบสวนที่"
              className="min-w-0 flex-1"
              value={h.interviewPlace}
              onChange={(v) => onHeaderChange("interviewPlace", v)}
            />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">ชื่อ</span>
            <DotInput
              aria-label="ชื่อผู้ให้การ"
              className="min-w-[8rem] flex-1"
              value={h.partyName}
              onChange={(v) => onHeaderChange("partyName", v)}
            />
            <span className="font-bold">อายุ</span>
            <DotInput
              aria-label="อายุ"
              className="w-12"
              value={h.partyAge}
              onChange={(v) => onHeaderChange("partyAge", v)}
            />
            <span>ปี</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">เชื้อชาติ</span>
            <DotInput
              aria-label="เชื้อชาติ"
              className="min-w-[4rem] flex-1"
              value={h.ethnicity}
              onChange={(v) => onHeaderChange("ethnicity", v)}
            />
            <span className="font-bold">สัญชาติ</span>
            <DotInput
              aria-label="สัญชาติ"
              className="min-w-[4rem] flex-1"
              value={h.partyNationality}
              onChange={(v) => onHeaderChange("partyNationality", v)}
            />
            <span className="font-bold">ศาสนา</span>
            <DotInput
              aria-label="ศาสนา"
              className="min-w-[4rem] flex-1"
              value={h.religion}
              onChange={(v) => onHeaderChange("religion", v)}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-bold">อาชีพ</span>
              <DotInput
                aria-label="อาชีพ"
                className="min-w-0 flex-1"
                value={h.partyOccupation}
                onChange={(v) => onHeaderChange("partyOccupation", v)}
              />
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-[#333]">
              (ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด
              หรือบำเหน็จ บำนาญ หรือไม่ ให้ลงตามประเภทที่รับ)
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">อยู่บ้านเลขที่</span>
            <DotInput
              aria-label="บ้านเลขที่"
              className="w-16"
              value={h.houseNo}
              onChange={(v) => onHeaderChange("houseNo", v)}
            />
            <span className="font-bold">หมู่ที่</span>
            <DotInput
              aria-label="หมู่ที่"
              className="w-12"
              value={h.moo}
              onChange={(v) => onHeaderChange("moo", v)}
            />
            <span className="font-bold">แขวง/ตำบล</span>
            <DotInput
              aria-label="แขวงตำบล"
              className="min-w-[5rem] flex-1"
              value={h.tambon}
              onChange={(v) => onHeaderChange("tambon", v)}
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">เขต/อำเภอ</span>
            <DotInput
              aria-label="เขตอำเภอที่อยู่"
              className="min-w-[5rem] flex-1"
              value={h.amphoe || h.district}
              onChange={(v) => onHeaderChange("amphoe", v)}
            />
            <span className="font-bold">จังหวัด</span>
            <DotInput
              aria-label="จังหวัดที่อยู่"
              className="min-w-[5rem] flex-1"
              value={h.province}
              onChange={(v) => onHeaderChange("province", v)}
            />
          </div>
          {h.partyAddress ? (
            <p className="text-[12px] text-slate-600">ที่อยู่เต็ม (อ้างอิง): {h.partyAddress}</p>
          ) : null}

          {/* ถาม–ตอบ ต่อท้ายแบบฟอร์ม */}
          <div className="mt-4 border-t border-[#222] pt-3">
            <p className="mb-2 text-center text-[14px] font-bold">บันทึกคำให้การ (ถาม / ตอบ)</p>
            {!page ? null : (
              <div className="space-y-2">
                {page.qa.map((qa, qi) => {
                  const no = qaOffset + qi + 1;
                  return (
                    <div key={qa.id} className="overflow-hidden border border-[#333]">
                      <div className="flex gap-2 border-b border-[#333] bg-[#f3f8fc] px-2 py-1.5">
                        <span className="shrink-0 pt-1 text-[13px] font-bold">ถาม {no}.</span>
                        <textarea
                          className="min-h-[2.2rem] flex-1 resize-y border-0 bg-transparent font-[inherit] text-[14px] outline-none"
                          value={qa.question}
                          placeholder="พิมพ์คำถาม…"
                          onChange={(e) => onQaChange(pageIndex, qi, "question", e.target.value)}
                        />
                        {page.qa.length > 1 ? (
                          <button
                            type="button"
                            className="shrink-0 text-[11px] font-bold text-rose-700"
                            onClick={() => onRemoveQa(qi)}
                          >
                            ลบ
                          </button>
                        ) : null}
                      </div>
                      <div className="flex gap-2 px-2 py-1.5">
                        <span className="shrink-0 pt-1 text-[13px] font-bold">ตอบ</span>
                        <textarea
                          className="min-h-[4rem] flex-1 resize-y border-0 bg-transparent font-[inherit] text-[14px] outline-none"
                          value={qa.answer}
                          placeholder="พิมพ์คำตอบ…"
                          onChange={(e) => onQaChange(pageIndex, qi, "answer", e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              className="mt-2 text-[13px] font-bold text-[#4d47b6] underline"
              onClick={onAddQa}
            >
              + เพิ่มถาม–ตอบ
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-center text-[13px]">
            <div>
              <p>ลงชื่อผู้ให้การ</p>
              <div className="mx-4 mt-5 border-b border-dotted border-[#333]" />
              <p className="mt-1">({h.partyName || "………………"})</p>
            </div>
            <div>
              <p>ลงชื่อพนักงานสอบสวน</p>
              <div className="mx-4 mt-5 border-b border-dotted border-[#333]" />
              <p className="mt-1">({h.investigator || "………………"})</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
