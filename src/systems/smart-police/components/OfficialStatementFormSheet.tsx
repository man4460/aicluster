"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";

/** พิมพ์บนจุดไข่ปลา — ไม่มีกรอบ ไม่มีพื้น ไม่มีมุมมน */
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
      className={cn(
        "m-0 inline border-0 border-b border-dotted border-[#111] bg-transparent p-0 align-baseline",
        "font-[inherit] text-[inherit] leading-[inherit] text-[#111] outline-none shadow-none ring-0",
        "rounded-none appearance-none focus:border-[#111] focus:outline-none focus:ring-0",
        className,
      )}
      style={{ minWidth: `${minCh}ch`, width: `${Math.max(minCh, (value || "").length + 1)}ch` }}
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
      className={cn(
        "m-0 w-full min-w-0 border-0 border-b border-dotted border-[#111] bg-transparent p-0",
        "font-[inherit] text-[inherit] leading-[inherit] text-[#111] outline-none shadow-none ring-0",
        "rounded-none appearance-none focus:outline-none focus:ring-0",
        className,
      )}
    />
  );
}

function BodyEditor({
  value,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  className?: string;
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
        "min-h-[9rem] w-full whitespace-pre-wrap break-words outline-none",
        "bg-[repeating-linear-gradient(transparent_0,transparent_21px,#111_21px,#111_22px)] bg-local",
        "font-[inherit] text-[15px] leading-[22px] text-[#111]",
        "rounded-none border-0 shadow-none focus:outline-none",
        className,
      )}
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
 * แบบฟอร์มราชการ คำให้การ — HTML ไหลเหมือน Word
 * ป้ายคงที่ + พิมพ์บนจุดไข่ปลา (ไม่มีกล่อง)
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
      className={cn(
        "mx-auto w-full max-w-[210mm] bg-white px-[12mm] py-[10mm] text-[#111] shadow-xl",
        "font-['TH_Sarabun_New','Sarabun','Cordia_New',Tahoma,sans-serif] text-[15px] leading-[1.45]",
        className,
      )}
    >
      {isCont ? (
        <div className="min-h-[270mm] border-r border-[#111] pr-2">
          <p className="mb-3 text-[13px]">
            ใบต่อบันทึกคำให้การ ของ <Dot value={h.partyName} onChange={(v) => set("partyName", v)} minCh={16} />
            <span className="float-right">แผ่น {pageIndex + 1}</span>
          </p>
          <BodyEditor
            ariaLabel="ข้อความคำให้การหน้าต่อ"
            className="min-h-[240mm]"
            value={page?.text ?? ""}
            onChange={(t) => onPageTextChange(pageIndex, t)}
          />
          <p className="mt-4 text-[11px] text-[#444]">(ส ๕๖ - ๔)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[48mm_1fr]">
          {/* แถบซ้าย */}
          <aside className="relative space-y-3 border-[#111] pr-2 text-[13.5px] leading-snug sm:border-r sm:pr-3">
            <div>
              <div className="font-bold">คำให้การของ</div>
              <LineFill aria-label="คำให้การของ" value={h.partyName} onChange={(v) => set("partyName", v)} />
            </div>
            <div>
              <span className="font-bold">เป็น</span>{" "}
              <Dot
                aria-label="เป็น"
                value={h.partyRoleLabel}
                onChange={(v) => set("partyRoleLabel", v)}
                minCh={10}
              />
            </div>
            <div>
              <div className="font-bold">หมายเลขโทรศัพท์</div>
              <LineFill aria-label="หมายเลขโทรศัพท์" value={h.partyPhone} onChange={(v) => set("partyPhone", v)} />
            </div>
            <div>
              <div className="font-bold">บัตรประจำตัวประชาชน</div>
              <LineFill
                aria-label="บัตรประจำตัวประชาชน"
                value={h.partyIdCard}
                onChange={(v) => set("partyIdCard", v)}
              />
            </div>
            <div>
              <div className="font-bold">ออกเมื่อ</div>
              <LineFill aria-label="ออกเมื่อ" value={h.idIssuedOn} onChange={(v) => set("idIssuedOn", v)} />
            </div>
            <div>
              <div className="font-bold">หมดอายุ</div>
              <LineFill aria-label="หมดอายุ" value={h.idExpiresOn} onChange={(v) => set("idExpiresOn", v)} />
            </div>
            <div>
              <div className="font-bold">ออกให้ ณ</div>
              <LineFill aria-label="ออกให้ ณ" value={h.idIssuedAt} onChange={(v) => set("idIssuedAt", v)} />
            </div>
            <p className="pt-6 text-center text-[13px]">
              <span className="font-bold">ลงชื่อ</span>
              <span className="mx-1 inline-block min-w-[3rem] border-b border-dotted border-[#111]" />
              <span className="font-bold">บันทึก</span>
            </p>
            <p className="pt-8 text-[11px] text-[#444]">(ส ๕๖ - ๔)</p>
          </aside>

          {/* เนื้อหาหลัก */}
          <div className="min-w-0 pl-0 sm:pl-3">
            <header className="mb-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smart-police/garuda.png"
                alt=""
                width={58}
                height={66}
                className="mx-auto mb-0.5 h-[58px] w-auto object-contain"
              />
              <p className="m-0 text-[15px] font-bold">สำนักงานตำรวจแห่งชาติ</p>
              <h1 className="mt-0.5 text-[16px] font-bold underline decoration-1 underline-offset-2">
                บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน
              </h1>
            </header>

            <p className="mb-1">
              <span className="font-bold">สถานีตำรวจ</span>{" "}
              <Dot aria-label="สถานีตำรวจ" value={h.stationName} onChange={(v) => set("stationName", v)} minCh={14} />{" "}
              <span className="font-bold">เขต/อำเภอ</span>{" "}
              <Dot aria-label="เขตอำเภอสถานี" value={h.district} onChange={(v) => set("district", v)} minCh={8} />{" "}
              <span className="font-bold">จังหวัด</span>{" "}
              <Dot aria-label="จังหวัด" value={h.province} onChange={(v) => set("province", v)} minCh={10} />
            </p>

            <p className="mb-2">
              <span className="font-bold">วันที่</span>{" "}
              <Dot aria-label="วันที่" value={h.dayThai} onChange={(v) => set("dayThai", v)} minCh={3} />{" "}
              <span className="font-bold">เดือน</span>{" "}
              <Dot aria-label="เดือน" value={h.monthThai} onChange={(v) => set("monthThai", v)} minCh={8} />{" "}
              <span className="font-bold">พ.ศ.</span>{" "}
              <Dot aria-label="พ.ศ." value={h.yearThai} onChange={(v) => set("yearThai", v)} minCh={5} />
            </p>

            <div className="mb-2 grid grid-cols-[auto_auto_1fr] items-center gap-x-2">
              <span className="font-bold">คดีระหว่าง</span>
              <span className="select-none text-[40px] leading-none" aria-hidden>
                {"{"}
              </span>
              <div className="space-y-1.5">
                <p className="flex items-baseline gap-2">
                  <LineFill
                    aria-label="ผู้กล่าวหาในคดี"
                    className="flex-1"
                    value={h.complainantLine}
                    onChange={(v) => set("complainantLine", v)}
                  />
                  <span className="shrink-0 font-bold">ผู้กล่าวหา</span>
                </p>
                <p className="flex items-baseline gap-2">
                  <LineFill
                    aria-label="ผู้ต้องหาในคดี"
                    className="flex-1"
                    value={h.suspectLine}
                    onChange={(v) => set("suspectLine", v)}
                  />
                  <span className="shrink-0 font-bold">ผู้ต้องหา</span>
                </p>
              </div>
            </div>

            <p className="mb-1 flex items-baseline gap-2">
              <span className="shrink-0 font-bold">ต่อหน้า</span>
              <LineFill
                aria-label="ต่อหน้า"
                className="flex-1"
                value={h.investigator}
                onChange={(v) => set("investigator", v)}
              />
            </p>
            <p className="mb-1">
              <LineFill
                aria-label="ต่อหน้าบรรทัด2"
                value={h.commanderLine}
                onChange={(v) => set("commanderLine", v)}
              />
            </p>

            <p className="mb-1 flex items-baseline gap-2">
              <span className="shrink-0 font-bold">สอบสวนที่</span>
              <LineFill
                aria-label="สอบสวนที่"
                className="flex-1"
                value={h.interviewPlace}
                onChange={(v) => set("interviewPlace", v)}
              />
            </p>

            <p className="mb-1">
              <span className="font-bold">ชื่อ</span>{" "}
              <Dot aria-label="ชื่อ" value={h.partyName} onChange={(v) => set("partyName", v)} minCh={18} />{" "}
              <span className="font-bold">อายุ</span>{" "}
              <Dot aria-label="อายุ" value={h.partyAge} onChange={(v) => set("partyAge", v)} minCh={3} /> ปี
            </p>

            <p className="mb-1">
              <span className="font-bold">เชื้อชาติ</span>{" "}
              <Dot aria-label="เชื้อชาติ" value={h.ethnicity} onChange={(v) => set("ethnicity", v)} minCh={6} />{" "}
              <span className="font-bold">สัญชาติ</span>{" "}
              <Dot
                aria-label="สัญชาติ"
                value={h.partyNationality}
                onChange={(v) => set("partyNationality", v)}
                minCh={6}
              />{" "}
              <span className="font-bold">ศาสนา</span>{" "}
              <Dot aria-label="ศาสนา" value={h.religion} onChange={(v) => set("religion", v)} minCh={6} />
            </p>

            <p className="mb-0.5 flex items-baseline gap-2">
              <span className="shrink-0 font-bold">อาชีพ</span>
              <LineFill
                aria-label="อาชีพ"
                className="flex-1"
                value={h.partyOccupation}
                onChange={(v) => set("partyOccupation", v)}
              />
            </p>
            <p className="mb-2 text-[11px] leading-snug">
              (ลงให้ชัดเจนว่าอาชีพใด ถ้าเป็นข้าราชการ ให้ปรากฏว่าในหรือนอกราชการ มีเบี้ยหวัด หรือบำเหน็จ บำนาญ
              หรือไม่ ให้ลงตามประเภทที่รับ)
            </p>

            <p className="mb-1">
              <span className="font-bold">อยู่บ้านเลขที่</span>{" "}
              <Dot aria-label="บ้านเลขที่" value={h.houseNo} onChange={(v) => set("houseNo", v)} minCh={4} />{" "}
              <span className="font-bold">หมู่ที่</span>{" "}
              <Dot aria-label="หมู่ที่" value={h.moo} onChange={(v) => set("moo", v)} minCh={3} />{" "}
              <span className="font-bold">แขวง/ตำบล</span>{" "}
              <Dot aria-label="แขวงตำบล" value={h.tambon} onChange={(v) => set("tambon", v)} minCh={8} />
            </p>
            <p className="mb-1">
              <span className="font-bold">เขต/อำเภอ</span>{" "}
              <Dot
                aria-label="เขตอำเภอที่อยู่"
                value={h.amphoe || h.district}
                onChange={(v) => set("amphoe", v)}
                minCh={8}
              />{" "}
              <span className="font-bold">จังหวัด</span>{" "}
              <Dot aria-label="จังหวัดที่อยู่" value={h.province} onChange={(v) => set("province", v)} minCh={8} />
            </p>

            <p className="mb-1">
              <span className="font-bold">ชื่อผู้ใหญ่บ้าน</span>{" "}
              <Dot aria-label="ชื่อผู้ใหญ่บ้าน" value={h.villageHead} onChange={(v) => set("villageHead", v)} minCh={10} />{" "}
              <span className="font-bold">ชื่อกำนัน</span>{" "}
              <Dot aria-label="ชื่อกำนัน" value={h.kamnan} onChange={(v) => set("kamnan", v)} minCh={10} />
            </p>
            <p className="mb-1">
              <span className="font-bold">ชื่อบิดา</span>{" "}
              <Dot aria-label="ชื่อบิดา" value={h.fatherName} onChange={(v) => set("fatherName", v)} minCh={10} />{" "}
              <span className="font-bold">ชื่อมารดา</span>{" "}
              <Dot aria-label="ชื่อมารดา" value={h.motherName} onChange={(v) => set("motherName", v)} minCh={10} />
            </p>

            <p className="mb-2">
              <span className="font-bold">เกี่ยวข้องเป็นอะไรกับคู่กรณี</span>{" "}
              <Dot
                aria-label="เกี่ยวข้องกับคู่กรณี"
                value={h.relationshipNote}
                onChange={(v) => set("relationshipNote", v)}
                minCh={18}
              />
            </p>

            <p className="mb-2 font-bold">ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า</p>

            <BodyEditor
              ariaLabel="ข้อความคำให้การ"
              value={page?.text ?? ""}
              onChange={(t) => onPageTextChange(0, t)}
            />

            <div className="mt-8 grid grid-cols-2 gap-6 text-center text-[13px]">
              <div>
                <p>ลงชื่อผู้ให้การ</p>
                <div className="mx-4 mt-5 border-b border-dotted border-[#111]" />
                <p className="mt-1">({h.partyName || "………………"})</p>
              </div>
              <div>
                <p>ลงชื่อพนักงานสอบสวน</p>
                <div className="mx-4 mt-5 border-b border-dotted border-[#111]" />
                <p className="mt-1">({h.investigator || "………………"})</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
