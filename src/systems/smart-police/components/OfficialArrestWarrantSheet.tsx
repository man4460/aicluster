"use client";

import { type ArrestWarrantFields } from "@/lib/smart-police/form-templates/arrest-warrant";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import {
  AutoLinedField,
  CheckBox,
  ExtraLines,
  Lbl,
  Line,
  Sheet,
  SheetCtx,
} from "@/systems/smart-police/components/OfficialSearchWarrantRequestSheet";

const TITLE = 20;
const HEAD = 22;

// ระยะแถวเท่ากันทั้งหน้า = LINE 7.76 มม.
const R = (k: number) => Number((54.7 + 7.76 * k).toFixed(2));

export function OfficialArrestWarrantDocument({
  fields,
  onChange,
  layout = emptySheetLayout(),
  edit = false,
  onDragStart,
  onResizeStart,
  onTextChange,
  onToggleHidden,
  onLineDrag,
  onLineResize,
  onDeleteExtra,
}: {
  fields: ArrestWarrantFields;
  onChange: <K extends keyof ArrestWarrantFields>(key: K, value: ArrestWarrantFields[K]) => void;
  layout?: SheetLayout;
  edit?: boolean;
  onDragStart?: (key: string, e: React.PointerEvent) => void;
  onResizeStart?: (key: string, e: React.PointerEvent) => void;
  onTextChange?: (key: string, text: string) => void;
  onToggleHidden?: (key: string) => void;
  onLineDrag?: (id: string, e: React.PointerEvent) => void;
  onLineResize?: (id: string, e: React.PointerEvent) => void;
  onDeleteExtra?: (id: string) => void;
}) {
  const toggle = (key: keyof ArrestWarrantFields) => () => onChange(key, !fields[key] as never);

  return (
    <SheetCtx.Provider value={{ layout, edit, onDragStart, onResizeStart, onTextChange, onToggleHidden, onLineDrag, onLineResize, onDeleteExtra }}>
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
        <ExtraLines page={0} />
        {/* หัวแผ่น */}
        <Lbl x={172.0} y={13.2} size={12}>
          สำหรับศาลใช้
        </Lbl>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smart-police/garuda.png"
          alt=""
          width={96}
          height={110}
          style={{ position: "absolute", left: "88.6mm", top: "12mm", width: "26.4mm", height: "26.8mm", objectFit: "contain" }}
        />
        <Lbl x={25.5} y={24.7} size={TITLE} bold>
          หมายจับ
        </Lbl>
        <Line labelX={138.2} label="ที่" x0={144.5} x1={193.38} y={25.4} value={fields.docNo} onChange={(v) => onChange("docNo", v)} aria="ที่" />

        <Lbl center y={43.7} size={HEAD} bold nowrap={false}>
          ในพระปรมาภิไธยพระมหากษัตริย์
        </Lbl>

        <Line labelX={103.2} label="ศาล" x0={111.0} x1={150.0} y={R(0)} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Line labelX={95.0} label="วันที่" x0={105.0} x1={120.0} y={R(1)} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={120.0} label="เดือน" x0={128.0} x1={143.0} y={R(1)} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={143.0} label="พุทธศักราช" x0={165.0} x1={193.38} y={R(1)} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={25.5} y={R(2)}>
          ความอาญา
        </Lbl>
        <Line x0={43.0} x1={90.0} y={R(2)} value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} aria="ความอาญา" />

        <Lbl x={25.5} y={R(3)}>
          ผู้ร้อง
        </Lbl>
        <Line x0={40.30} x1={193.38} y={R(3)} value={fields.petitioner} onChange={(v) => onChange("petitioner", v)} aria="ผู้ร้อง" />

        <Lbl x={25.5} y={R(4)}>
          หมายถึง
        </Lbl>
        <Line x0={40.30} x1={193.38} y={R(4)} value={fields.address} onChange={(v) => onChange("address", v)} aria="หมายถึง" />

        {/* ด้วย (พิมพ์ต่อเนื่อง 4 บรรทัด) */}
        <Lbl x={25.5} y={R(5)}>
          ด้วย
        </Lbl>
        <AutoLinedField
          k="aw-whereas"
          aria="ด้วย"
          value={fields.whereasText}
          onChange={(v) => onChange("whereasText", v)}
          left={24.5}
          top={Number((R(5) + 0.7).toFixed(2))}
          width={168.88}
          minLines={4}
          indent={10.1}
          firstLeft={34.6}
          firstWidth={158.78}
          restLeft={24.5}
          restWidth={168.88}
        />

        {/* ฐานความผิด (พิมพ์ต่อเนื่อง 3 บรรทัด) */}
        <Lbl x={25.5} y={R(9)} nowrap={false} w={165}>
          ซึ่งต้องหาว่ากระทำความผิดฐาน
        </Lbl>
        <AutoLinedField
          k="aw-charge"
          aria="ข้อหา"
          value={fields.chargeText}
          onChange={(v) => onChange("chargeText", v)}
          left={24.5}
          top={Number((R(9) + 0.7).toFixed(2))}
          width={168.88}
          minLines={3}
          indent={55.7}
          firstLeft={80.2}
          firstWidth={113.18}
          restLeft={24.5}
          restWidth={168.88}
        />

        {/* หลักฐาน (พิมพ์ต่อเนื่อง 2 บรรทัด) */}
        <Lbl x={25.5} y={R(12)} nowrap={false} w={165}>
          กรณีมีหลักฐานตามสมควรว่า
        </Lbl>
        <AutoLinedField
          k="aw-evidence"
          aria="หลักฐาน"
          value={fields.evidenceText}
          onChange={(v) => onChange("evidenceText", v)}
          left={24.5}
          top={Number((R(12) + 0.7).toFixed(2))}
          width={168.88}
          minLines={2}
          indent={48.1}
          firstLeft={72.6}
          firstWidth={120.78}
          restLeft={24.5}
          restWidth={168.88}
        />

        <CheckBox x={25.5} y={R(14)} checked={fields.ground1} onToggle={toggle("ground1")} label="ได้หรือน่าจะได้กระทำความผิดอาญาซึ่งมีอัตราโทษจำคุกอย่างสูงเกินสามปี" />
        <CheckBox x={25.5} y={R(15)} checked={fields.ground2} onToggle={toggle("ground2")} label="ได้หรือน่าจะได้กระทำความผิดอาญาและมีเหตุอันควรเชื่อว่า" />
        <CheckBox x={38.0} y={R(16)} checked={fields.ground2_1} onToggle={toggle("ground2_1")} label="จะหลบหนี" />
        <CheckBox x={38.0} y={R(17)} checked={fields.ground2_2} onToggle={toggle("ground2_2")} label="จะไปยุ่งเหยิงกับพยานหลักฐาน" />
        <CheckBox x={38.0} y={R(18)} checked={fields.ground2_3} onToggle={toggle("ground2_3")} label="ก่อเหตุอันตรายประการอื่น" />
        <CheckBox x={25.5} y={R(19)} checked={fields.ground3} onToggle={toggle("ground3")} label="อื่น ๆ" />

        <Lbl x={25.5} y={R(20)}>
          เพราะฉะนั้นให้ท่านจับตัว
        </Lbl>
        <Line x0={72.60} x1={193.38} y={R(20)} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="ผู้ถูกจับ" />

        <Line labelX={25.7} label="เลขประจำตัวประชาชน" x0={62.0} x1={130.0} y={R(21)} value={fields.idNumber} onChange={(v) => onChange("idNumber", v)} aria="เลขประจำตัวประชาชน" />
        <Line labelX={150.7} label="เชื้อชาติ" x0={163.0} x1={193.38} y={R(21)} value={fields.ethnicity} onChange={(v) => onChange("ethnicity", v)} aria="เชื้อชาติ" />

        <Line labelX={25.7} label="สัญชาติ" x0={37.5} x1={52.0} y={R(22)} value={fields.nationality} onChange={(v) => onChange("nationality", v)} aria="สัญชาติ" />
        <Line labelX={58.2} label="อาชีพ" x0={68.0} x1={92.0} y={R(22)} value={fields.occupation} onChange={(v) => onChange("occupation", v)} aria="อาชีพ" />
        <Line labelX={98.2} label="อยู่บ้านเลขที่" x0={120.0} x1={168.0} y={R(22)} value={fields.houseNo} onChange={(v) => onChange("houseNo", v)} aria="อยู่บ้านเลขที่" />
        <Line labelX={172.5} label="หมู่ที่" x0={181.0} x1={193.38} y={R(22)} value={fields.moo} onChange={(v) => onChange("moo", v)} aria="หมู่ที่" />

        <Line labelX={25.7} label="ถนน" x0={33.0} x1={62.0} y={R(23)} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={145.7} label="ตรอก/ซอย" x0={163.0} x1={175.0} y={R(23)} value={fields.alley} onChange={(v) => onChange("alley", v)} aria="ตรอกซอย" />
        <Lbl x={176.0} y={R(23)}>
          ใกล้
        </Lbl>
        <Line x0={182.5} x1={193.38} y={R(23)} value={fields.near} onChange={(v) => onChange("near", v)} aria="ใกล้" />

        <Line labelX={25.7} label="ตำบล/แขวง" x0={45.0} x1={130.0} y={R(25)} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="ตำบลแขวง" />
        <Line labelX={145.7} label="อำเภอ/เขต" x0={163.5} x1={175.0} y={R(25)} value={fields.district} onChange={(v) => onChange("district", v)} aria="อำเภอเขต" />
        <Lbl x={176.0} y={R(25)}>
          จังหวัด
        </Lbl>
        <Line x0={188.0} x1={193.38} y={R(25)} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />

        <Line labelX={25.7} label="โทรศัพท์" x0={40.0} x1={62.0} y={R(27)} value={fields.phone} onChange={(v) => onChange("phone", v)} aria="โทรศัพท์" />
        <Line labelX={145.7} label="ไปส่งที่" x0={159.0} x1={193.38} y={R(27)} value={fields.sendTo} onChange={(v) => onChange("sendTo", v)} aria="ไปส่งที่" />

        <Lbl x={25.5} y={R(29)}>
          ภายในอายุความ
        </Lbl>
        <Line x0={50.0} x1={57.5} y={R(29)} value={fields.ageLimit} onChange={(v) => onChange("ageLimit", v)} aria="อายุความปี" />
        <Lbl x={58.5} y={R(29)}>
          ปีนับตั้งแต่วันที่
        </Lbl>
        <Line x0={82.0} x1={90.0} y={R(29)} value={fields.fromDay} onChange={(v) => onChange("fromDay", v)} aria="จากวันที่" />
        <Lbl x={91.0} y={R(29)}>
          เดือน
        </Lbl>
        <Line x0={100.0} x1={109.0} y={R(29)} value={fields.fromMonth} onChange={(v) => onChange("fromMonth", v)} aria="จากเดือน" />
        <Lbl x={110.0} y={R(29)}>
          พ.ศ.
        </Lbl>
        <Line x0={118.0} x1={128.0} y={R(29)} value={fields.fromYear} onChange={(v) => onChange("fromYear", v)} aria="จากปี" />
        <Lbl x={129.0} y={R(29)}>
          เพื่อจะ
        </Lbl>
        <Line x0={140.0} x1={193.38} y={R(29)} value={fields.purposeText} onChange={(v) => onChange("purposeText", v)} aria="เพื่อจะ" />
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
