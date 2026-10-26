"use client";

import { type SearchWarrantFields } from "@/lib/smart-police/form-templates/search-warrant";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import {
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
const R = (k: number) => Number((55.6 + 7.76 * k).toFixed(2));

export function OfficialSearchWarrantDocument({
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
  fields: SearchWarrantFields;
  onChange: <K extends keyof SearchWarrantFields>(key: K, value: SearchWarrantFields[K]) => void;
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
  const toggle = (key: keyof SearchWarrantFields) => () => onChange(key, !fields[key] as never);

  return (
    <SheetCtx.Provider value={{ layout, edit, onDragStart, onResizeStart, onTextChange, onToggleHidden, onLineDrag, onLineResize, onDeleteExtra }}>
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
        <ExtraLines page={0} />
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
          หมายค้น
        </Lbl>
        <Line labelX={138.2} label="ที่" x0={144.5} x1={193.38} y={26.3} value={fields.docNo} onChange={(v) => onChange("docNo", v)} aria="ที่" />

        <Lbl center y={45.1} size={HEAD} bold nowrap={false}>
          ในพระปรมาภิไธยพระมหากษัตริย์
        </Lbl>

        <Line labelX={103.2} label="ศาล" x0={111.0} x1={150.0} y={R(0)} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Line labelX={95.0} label="วันที่" x0={105.0} x1={120.0} y={R(1)} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={120.0} label="เดือน" x0={128.0} x1={143.0} y={R(1)} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={143.0} label="พุทธศักราช" x0={166.0} x1={193.38} y={R(1)} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

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

        <Lbl x={43.2} y={R(5)} nowrap>
          ด้วยศาลเห็นมีเหตุสมควรให้ค้นสถานที่/บ้านเลขที่
        </Lbl>
        <Line x0={116.0} x1={170.5} y={R(5)} value={fields.searchPlace} onChange={(v) => onChange("searchPlace", v)} aria="สถานที่ค้น" />
        <Lbl x={172.0} y={R(5)}>
          หมู่ที่
        </Lbl>
        <Line x0={181.0} x1={193.38} y={R(5)} value={fields.moo} onChange={(v) => onChange("moo", v)} aria="หมู่ที่" />

        <Line labelX={23.2} label="ตรอก/ซอย" x0={40.0} x1={78.0} y={R(6)} value={fields.alley} onChange={(v) => onChange("alley", v)} aria="ตรอกซอย" />
        <Line labelX={80.7} label="ถนน" x0={88.0} x1={131.0} y={R(6)} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={133.2} label="ตำบล/แขวง" x0={153.0} x1={193.38} y={R(6)} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="ตำบลแขวง" />

        <Line labelX={23.2} label="อำเภอ/เขต" x0={41.5} x1={78.0} y={R(7)} value={fields.district} onChange={(v) => onChange("district", v)} aria="อำเภอเขต" />
        <Line labelX={80.0} label="จังหวัด" x0={91.0} x1={133.0} y={R(7)} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />
        <Lbl x={135.0} y={R(7)} nowrap={false}>
          ตามแผนที่สังเขปแนบท้าย
        </Lbl>

        <CheckBox x={23.2} y={R(8)} checked={fields.ground1} onToggle={toggle("ground1")} label="เพื่อพบและยึดสิ่งของ*" />
        <CheckBox x={35.7} y={R(9)} checked={fields.ground1_1} onToggle={toggle("ground1_1")} label="ซึ่งจะเป็นพยานหลักฐานประกอบการสอบสวน ไต่สวนมูลฟ้องหรือพิจารณา" />
        <CheckBox x={35.7} y={R(10)} checked={fields.ground1_2} onToggle={toggle("ground1_2")} label="ซึ่งมีไว้เป็นความผิดหรือได้มาโดยผิดกฎหมาย หรือได้ใช้ หรือตั้งใจจะใช้ในการกระทำความผิด" />
        <CheckBox x={35.7} y={R(11)} checked={fields.ground1_3} onToggle={toggle("ground1_3")} label="ตามคำพิพากษาหรือคำสั่งของศาล" />
        <CheckBox x={23.2} y={R(12)} checked={fields.ground2} onToggle={toggle("ground2")} label="เพื่อพบ*" />
        <CheckBox x={35.7} y={R(13)} checked={fields.ground2_1} onToggle={toggle("ground2_1")} label="บุคคลที่ถูกหน่วงเหนี่ยวหรือกักขังโดยมิชอบด้วยกฎหมาย" />
        <CheckBox x={35.7} y={R(14)} checked={fields.ground2_2} onToggle={toggle("ground2_2")} label="บุคคลที่ถูกออกหมายจับ ตามหมายจับเลขที่" />
        <Line x0={108.0} x1={120.0} y={R(14)} value={fields.warrantNo} onChange={(v) => onChange("warrantNo", v)} aria="หมายจับเลขที่" />
        <Lbl x={121.5} y={R(14)}>
          / ลงวันที่
        </Lbl>
        <Line x0={140.0} x1={160.0} y={R(14)} value={fields.warrantDate} onChange={(v) => onChange("warrantDate", v)} aria="ลงวันที่" />
        <Lbl x={64.5} y={R(15)}>
          ซึ่งออกโดย
        </Lbl>
        <Line x0={82.0} x1={130.0} y={R(15)} value={fields.warrantBy} onChange={(v) => onChange("warrantBy", v)} aria="ออกโดย" />

        <Lbl x={43.2} y={R(16)}>
          จึงออกหมายค้นนี้ตามข้อ
        </Lbl>
        <Line x0={80.5} x1={86.0} y={R(16)} value={fields.orderNo} onChange={(v) => onChange("orderNo", v)} aria="ตามข้อ" />
        <Lbl x={87.5} y={R(16)}>
          ให้
        </Lbl>
        <Line x0={93.0} x1={170.0} y={R(16)} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="ผู้มีอำนาจ" />

        <Line labelX={23.2} label="ตำแหน่ง" x0={38.0} x1={110.0} y={R(17)} value={fields.position} onChange={(v) => onChange("position", v)} aria="ตำแหน่ง" />
        <Lbl x={140.7} y={R(17)} nowrap={false}>
          มีอำนาจค้นสถานที่/บ้านข้างต้นได้
        </Lbl>

        <Lbl x={23.2} y={R(18)}>
          ในวันที่
        </Lbl>
        <Line x0={35.5} x1={42.0} y={R(18)} value={fields.searchDay} onChange={(v) => onChange("searchDay", v)} aria="ค้นวันที่" />
        <Lbl x={44.0} y={R(18)}>
          เดือน
        </Lbl>
        <Line x0={52.5} x1={64.0} y={R(18)} value={fields.searchMonth} onChange={(v) => onChange("searchMonth", v)} aria="ค้นเดือน" />
        <Lbl x={66.0} y={R(18)}>
          พ.ศ.
        </Lbl>
        <Line x0={74.0} x1={86.0} y={R(18)} value={fields.searchYear} onChange={(v) => onChange("searchYear", v)} aria="ค้นปี" />
        <Lbl x={88.0} y={R(18)}>
          เวลา
        </Lbl>
        <Line x0={97.0} x1={115.0} y={R(18)} value={fields.searchTime} onChange={(v) => onChange("searchTime", v)} aria="เวลาค้น" />
        <Lbl x={117.0} y={R(18)}>
          นาฬิกา ถึง เวลา
        </Lbl>
        <Line x0={143.0} x1={160.0} y={R(18)} value={fields.searchTime2} onChange={(v) => onChange("searchTime2", v)} aria="เวลาถึง" />
        <Lbl x={162.0} y={R(18)}>
          นาฬิกา
        </Lbl>

        <CheckBox x={23.2} y={R(19)} checked={fields.dayTime} onToggle={toggle("dayTime")} label="เวลากลางวัน" />
        <CheckBox x={52.0} y={R(19)} checked={fields.nightTime} onToggle={toggle("nightTime")} label="เวลากลางคืน" />
        <Lbl x={78.5} y={R(19)} nowrap>
          ติดต่อกันไปจนกว่าจะเสร็จสิ้นการตรวจค้น
        </Lbl>

        <Lbl x={23.2} y={R(20)}>
          เมื่อค้นได้ตามหมายนี้แล้วให้ส่ง
        </Lbl>
        <Line x0={69.0} x1={160.0} y={R(20)} value={fields.itemsToSend} onChange={(v) => onChange("itemsToSend", v)} aria="สิ่งของที่ส่ง" />

        <Lbl x={23.2} y={R(22)} nowrap>
          พร้อมบันทึกการค้นและบัญชีสิ่งของ (ถ้ามี) ไปยัง
        </Lbl>
        <Line x0={95.0} x1={170.0} y={R(22)} value={fields.sendTo} onChange={(v) => onChange("sendTo", v)} aria="ไปยัง" />

        <Lbl x={23.2} y={R(23)}>
          เพื่อจัดการตามกฎหมายต่อไป
        </Lbl>

        <Lbl x={165.7} y={R(26)}>
          ผู้พิพากษา
        </Lbl>

        <Lbl x={25.7} y={R(28)} nowrap={false}>
          หมายเหตุ: * ให้ระบุชื่อหรือรูปพรรณบุคคลหรือลักษณะสิ่งของที่ต้องการค้น
        </Lbl>
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
