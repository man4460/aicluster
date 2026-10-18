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
        "border-0 border-b border-dotted border-[#222] bg-transparent px-0.5 pb-px font-[inherit] text-[inherit] outline-none focus:border-[#4d47b6]",
        className,
      )}
      value={value}
      placeholder={placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** แบบฟอร์มราชการ — ตามแม่แบบ คำให้การผู้กล่าวหา.docx (ส ๕๖-๔) */
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
  const isContinuation = pageIndex > 0;

  return (
    <article
      className={cn(
        "relative mx-auto w-full max-w-[210mm] bg-white text-[#111] shadow-xl",
        "font-['TH_Sarabun_New','Sarabun','Cordia_New',Tahoma,sans-serif] text-[14.5px] leading-[1.4]",
        "px-[11mm] py-[9mm]",
        className,
      )}
    >
      {isContinuation ? (
        <ContinuationPage
          page={page}
          pageIndex={pageIndex}
          qaOffset={qaOffset}
          onQaChange={onQaChange}
          onAddQa={onAddQa}
          onRemoveQa={onRemoveQa}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[46mm_1fr]">
            {/* แถบซ้าย */}
            <aside className="relative space-y-2.5 border-[#222] pr-2 pt-1 text-[13.5px] sm:border-r sm:pr-2.5">
              <SideField
                label="คำให้การของ"
                value={h.partyName}
                onChange={(v) => onHeaderChange("partyName", v)}
              />
              <SideField
                label="เป็น"
                value={h.partyRoleLabel}
                onChange={(v) => onHeaderChange("partyRoleLabel", v)}
              />
              <SideField
                label="หมายเลขโทรศัพท์"
                value={h.partyPhone}
                onChange={(v) => onHeaderChange("partyPhone", v)}
              />
              <SideField
                label="บัตรประจำตัวประชาชน"
                value={h.partyIdCard}
                onChange={(v) => onHeaderChange("partyIdCard", v)}
              />
              <SideField
                label="ออกเมื่อ"
                value={h.idIssuedOn}
                onChange={(v) => onHeaderChange("idIssuedOn", v)}
              />
              <SideField
                label="หมดอายุ"
                value={h.idExpiresOn}
                onChange={(v) => onHeaderChange("idExpiresOn", v)}
              />
              <SideField
                label="ออกให้ ณ"
                value={h.idIssuedAt}
                onChange={(v) => onHeaderChange("idIssuedAt", v)}
              />
              <div className="pt-8 text-center text-[13px]">
                <p>
                  <span className="font-bold">ลงชื่อ</span>
                  <span className="mx-1 inline-block min-w-[3.5rem] border-b border-dotted border-[#222]" />
                  <span className="font-bold">บันทึก</span>
                </p>
              </div>
              <p className="absolute bottom-0 left-0 text-[10px] text-[#444]">(ส ๕๖ - ๔)</p>
            </aside>

            {/* เนื้อหาหลัก */}
            <div className="min-w-0 pl-0 pt-0 sm:pl-3">
              <header className="mb-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/smart-police/garuda.png"
                  alt=""
                  width={56}
                  height={64}
                  className="mx-auto mb-0.5 h-[56px] w-auto object-contain"
                />
                <p className="m-0 text-[14.5px] font-bold tracking-wide">สำนักงานตำรวจแห่งชาติ</p>
                <h1 className="mt-0.5 text-[15.5px] font-bold leading-snug">
                  {formTitle || "บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน"}
                </h1>
              </header>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  <span className="font-bold">สถานีตำรวจ</span>
                  <DotInput
                    aria-label="สถานีตำรวจ"
                    className="min-w-[6rem] flex-1"
                    value={h.stationName}
                    onChange={(v) => onHeaderChange("stationName", v)}
                  />
                  <span className="font-bold">เขต/อำเภอ</span>
                  <DotInput
                    aria-label="เขตอำเภอสถานี"
                    className="min-w-[4rem] flex-1"
                    value={h.district}
                    onChange={(v) => onHeaderChange("district", v)}
                  />
                  <span className="font-bold">จังหวัด</span>
                  <DotInput
                    aria-label="จังหวัด"
                    className="min-w-[4.5rem] flex-1"
                    value={h.province}
                    onChange={(v) => onHeaderChange("province", v)}
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">วันที่</span>
                  <DotInput
                    aria-label="วันที่"
                    className="w-10"
                    value={h.dayThai}
                    onChange={(v) => onHeaderChange("dayThai", v)}
                  />
                  <span className="font-bold">เดือน</span>
                  <DotInput
                    aria-label="เดือน"
                    className="min-w-[4.5rem] flex-1"
                    value={h.monthThai}
                    onChange={(v) => onHeaderChange("monthThai", v)}
                  />
                  <span className="font-bold">พ.ศ.</span>
                  <DotInput
                    aria-label="พ.ศ."
                    className="w-14"
                    value={h.yearThai}
                    onChange={(v) => onHeaderChange("yearThai", v)}
                  />
                </div>

                <div className="my-1.5 grid grid-cols-[auto_auto_1fr] items-center gap-x-1.5">
                  <span className="font-bold">คดีระหว่าง</span>
                  <span className="select-none text-[38px] leading-none" aria-hidden>
                    {"{"}
                  </span>
                  <div className="flex flex-col gap-1.5 py-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <DotInput
                        aria-label="ผู้กล่าวหาในคดี"
                        className="min-w-0 flex-1"
                        value={h.complainantLine}
                        onChange={(v) => onHeaderChange("complainantLine", v)}
                      />
                      <span className="shrink-0 font-bold">ผู้กล่าวหา</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <DotInput
                        aria-label="ผู้ต้องหาในคดี"
                        className="min-w-0 flex-1"
                        value={h.suspectLine}
                        onChange={(v) => onHeaderChange("suspectLine", v)}
                      />
                      <span className="shrink-0 font-bold">ผู้ต้องหา</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">ต่อหน้า</span>
                  <DotInput
                    aria-label="ต่อหน้า"
                    className="min-w-0 flex-1"
                    value={h.investigator}
                    onChange={(v) => onHeaderChange("investigator", v)}
                  />
                </div>
                <DotInput
                  aria-label="ต่อหน้าบรรทัด 2"
                  className="w-full"
                  value={h.commanderLine}
                  onChange={(v) => onHeaderChange("commanderLine", v)}
                  placeholder=" "
                />

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">สอบสวนที่</span>
                  <DotInput
                    aria-label="สอบสวนที่"
                    className="min-w-0 flex-1"
                    value={h.interviewPlace}
                    onChange={(v) => onHeaderChange("interviewPlace", v)}
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">ชื่อ</span>
                  <DotInput
                    aria-label="ชื่อ"
                    className="min-w-[7rem] flex-1"
                    value={h.partyName}
                    onChange={(v) => onHeaderChange("partyName", v)}
                  />
                  <span className="font-bold">อายุ</span>
                  <DotInput
                    aria-label="อายุ"
                    className="w-10"
                    value={h.partyAge}
                    onChange={(v) => onHeaderChange("partyAge", v)}
                  />
                  <span>ปี</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">เชื้อชาติ</span>
                  <DotInput
                    aria-label="เชื้อชาติ"
                    className="min-w-[3.5rem] flex-1"
                    value={h.ethnicity}
                    onChange={(v) => onHeaderChange("ethnicity", v)}
                  />
                  <span className="font-bold">สัญชาติ</span>
                  <DotInput
                    aria-label="สัญชาติ"
                    className="min-w-[3.5rem] flex-1"
                    value={h.partyNationality}
                    onChange={(v) => onHeaderChange("partyNationality", v)}
                  />
                  <span className="font-bold">ศาสนา</span>
                  <DotInput
                    aria-label="ศาสนา"
                    className="min-w-[3.5rem] flex-1"
                    value={h.religion}
                    onChange={(v) => onHeaderChange("religion", v)}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-bold">อาชีพ</span>
                    <DotInput
                      aria-label="อาชีพ"
                      className="min-w-0 flex-1"
                      value={h.partyOccupation}
                      onChange={(v) => onHeaderChange("partyOccupation", v)}
                    />
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-[#222]">
                    (ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด
                    หรือบำเหน็จ บำนาญ หรือไม่ ให้ลงตามประเภทที่รับ)
                  </p>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">อยู่บ้านเลขที่</span>
                  <DotInput
                    aria-label="บ้านเลขที่"
                    className="w-14"
                    value={h.houseNo}
                    onChange={(v) => onHeaderChange("houseNo", v)}
                  />
                  <span className="font-bold">หมู่ที่</span>
                  <DotInput
                    aria-label="หมู่ที่"
                    className="w-10"
                    value={h.moo}
                    onChange={(v) => onHeaderChange("moo", v)}
                  />
                  <span className="font-bold">แขวง/ตำบล</span>
                  <DotInput
                    aria-label="แขวงตำบล"
                    className="min-w-[4rem] flex-1"
                    value={h.tambon}
                    onChange={(v) => onHeaderChange("tambon", v)}
                  />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">เขต/อำเภอ</span>
                  <DotInput
                    aria-label="เขตอำเภอที่อยู่"
                    className="min-w-[4rem] flex-1"
                    value={h.amphoe || h.district}
                    onChange={(v) => onHeaderChange("amphoe", v)}
                  />
                  <span className="font-bold">จังหวัด</span>
                  <DotInput
                    aria-label="จังหวัดที่อยู่"
                    className="min-w-[4rem] flex-1"
                    value={h.province}
                    onChange={(v) => onHeaderChange("province", v)}
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">ชื่อผู้ใหญ่บ้าน</span>
                  <DotInput
                    aria-label="ชื่อผู้ใหญ่บ้าน"
                    className="min-w-[4rem] flex-1"
                    value={h.villageHead}
                    onChange={(v) => onHeaderChange("villageHead", v)}
                  />
                  <span className="font-bold">ชื่อกำนัน</span>
                  <DotInput
                    aria-label="ชื่อกำนัน"
                    className="min-w-[4rem] flex-1"
                    value={h.kamnan}
                    onChange={(v) => onHeaderChange("kamnan", v)}
                  />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">ชื่อบิดา</span>
                  <DotInput
                    aria-label="ชื่อบิดา"
                    className="min-w-[4rem] flex-1"
                    value={h.fatherName}
                    onChange={(v) => onHeaderChange("fatherName", v)}
                  />
                  <span className="font-bold">ชื่อมารดา</span>
                  <DotInput
                    aria-label="ชื่อมารดา"
                    className="min-w-[4rem] flex-1"
                    value={h.motherName}
                    onChange={(v) => onHeaderChange("motherName", v)}
                  />
                </div>

                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-bold">เกี่ยวข้องเป็นอะไรกับคู่กรณี</span>
                  <DotInput
                    aria-label="เกี่ยวข้องกับคู่กรณี"
                    className="min-w-0 flex-1"
                    value={h.relationshipNote}
                    onChange={(v) => onHeaderChange("relationshipNote", v)}
                  />
                </div>

                <p className="pt-0.5 font-bold">
                  ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า
                </p>

                {/* โซนถาม–ตอบ = เนื้อหาคำให้การบนบรรทัดจุดไข่ปลา */}
                <div className="mt-1 space-y-2 border-t border-dotted border-[#999] pt-2">
                  {!page
                    ? null
                    : page.qa.map((qa, qi) => {
                        const no = qaOffset + qi + 1;
                        return (
                          <div key={qa.id} className="space-y-1">
                            <div className="flex gap-1.5">
                              <span className="shrink-0 font-bold">ถาม {no}.</span>
                              <textarea
                                className="min-h-[1.6rem] flex-1 resize-y border-0 border-b border-dotted border-[#222] bg-transparent font-[inherit] text-[14px] outline-none focus:border-[#4d47b6]"
                                value={qa.question}
                                placeholder="…………………………………………"
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
                            <div className="flex gap-1.5">
                              <span className="shrink-0 font-bold">ตอบ</span>
                              <textarea
                                className="min-h-[3.2rem] flex-1 resize-y border-0 bg-[repeating-linear-gradient(transparent,transparent_1.35em,#222_1.35em,#222_calc(1.35em+1px))] bg-[length:100%_1.4em] font-[inherit] text-[14px] leading-[1.4] outline-none"
                                style={{ backgroundPositionY: "1.35em" }}
                                value={qa.answer}
                                placeholder="…………………………………………"
                                onChange={(e) => onQaChange(pageIndex, qi, "answer", e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                  <button
                    type="button"
                    className="text-[12.5px] font-bold text-[#4d47b6] underline"
                    onClick={onAddQa}
                  >
                    + เพิ่มถาม–ตอบ
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-center text-[13px]">
                  <div>
                    <p>ลงชื่อผู้ให้การ</p>
                    <div className="mx-3 mt-4 border-b border-dotted border-[#222]" />
                    <p className="mt-0.5">({h.partyName || "………………"})</p>
                  </div>
                  <div>
                    <p>ลงชื่อพนักงานสอบสวน</p>
                    <div className="mx-3 mt-4 border-b border-dotted border-[#222]" />
                    <p className="mt-0.5">({h.investigator || "………………"})</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function SideField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="font-bold">{label}</span>
      <DotInput aria-label={label} className="mt-0.5 w-full" value={value} onChange={onChange} />
    </div>
  );
}

function ContinuationPage({
  page,
  pageIndex,
  qaOffset,
  onQaChange,
  onAddQa,
  onRemoveQa,
}: {
  page: StatementPage | undefined;
  pageIndex: number;
  qaOffset: number;
  onQaChange: (pageIdx: number, qaIdx: number, field: keyof StatementQaItem, value: string) => void;
  onAddQa: () => void;
  onRemoveQa: (qaIdx: number) => void;
}) {
  return (
    <div className="relative min-h-[270mm] border-r-2 border-[#222] pr-2">
      <p className="mb-3 text-center text-[13px] font-bold text-[#444]">
        บันทึกคำให้การ (ต่อ) — หน้า {pageIndex + 1}
      </p>
      <div className="space-y-3">
        {!page
          ? null
          : page.qa.map((qa, qi) => {
              const no = qaOffset + qi + 1;
              return (
                <div key={qa.id} className="space-y-1">
                  <div className="flex gap-1.5">
                    <span className="shrink-0 font-bold">ถาม {no}.</span>
                    <textarea
                      className="min-h-[1.6rem] flex-1 resize-y border-0 border-b border-dotted border-[#222] bg-transparent font-[inherit] outline-none"
                      value={qa.question}
                      onChange={(e) => onQaChange(pageIndex, qi, "question", e.target.value)}
                    />
                    {page.qa.length > 1 ? (
                      <button
                        type="button"
                        className="text-[11px] font-bold text-rose-700"
                        onClick={() => onRemoveQa(qi)}
                      >
                        ลบ
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    className="min-h-[5rem] w-full resize-y border-0 bg-[repeating-linear-gradient(transparent,transparent_1.35em,#222_1.35em,#222_calc(1.35em+1px))] bg-[length:100%_1.4em] font-[inherit] leading-[1.4] outline-none"
                    value={qa.answer}
                    placeholder="ตอบ …………………………………………"
                    onChange={(e) => onQaChange(pageIndex, qi, "answer", e.target.value)}
                  />
                </div>
              );
            })}
      </div>
      <button type="button" className="mt-3 text-[12.5px] font-bold text-[#4d47b6] underline" onClick={onAddQa}>
        + เพิ่มถาม–ตอบ
      </button>
    </div>
  );
}
