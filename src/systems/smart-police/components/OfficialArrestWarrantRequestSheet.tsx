"use client";

import { type ArrestWarrantRequestFields } from "@/lib/smart-police/form-templates/arrest-warrant-request";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import {
  Lbl,
  Line,
  Sheet,
  SheetCtx,
  ExtraLines,
  AutoLinedField,
  CheckBox,
} from "@/systems/smart-police/components/OfficialSearchWarrantRequestSheet";

const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 18;
const LINE = 7.76;
const RULE_DY = 6.2;

export function OfficialArrestWarrantRequestDocument({
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
  fields: ArrestWarrantRequestFields;
  onChange: <K extends keyof ArrestWarrantRequestFields>(key: K, value: ArrestWarrantRequestFields[K]) => void;
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
  return (
    <SheetCtx.Provider value={{ layout, edit, onDragStart, onResizeStart, onTextChange, onToggleHidden, onLineDrag, onLineResize, onDeleteExtra }}>
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
        <ExtraLines page={0} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smart-police/garuda.png"
          alt=""
          width={96}
          height={110}
          style={{ position: "absolute", left: "88.6mm", top: "12mm", width: "26.4mm", height: "26.8mm", objectFit: "contain" }}
        />
        <Lbl x={25.7} y={26.2} size={TITLE} bold>
          คำร้อง-ขอออกหมายจับ
        </Lbl>
        <Line labelX={141.6} label="ที่" x0={146.0} x1={193.38} y={38.0} value={fields.docNo} onChange={(v) => onChange("docNo", v)} aria="ที่" />

        <Lbl x={24.5} y={46.80}>
          รับคำร้อง
        </Lbl>
        <Line labelX={102.9} label="ศาล" x0={110.0} x1={193.38} y={46.80} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Lbl x={24.5} y={55.60}>
          เรียกสอบ
        </Lbl>
        <Line labelX={95.0} label="วันที่" x0={105.0} x1={119.0} y={55.60} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={119.0} label="เดือน" x0={127.0} x1={141.0} y={55.60} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={141.0} label="พุทธศักราช" x0={159.0} x1={193.38} y={55.60} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={53.5} y={64.40}>
          ผู้พิพากษา
        </Lbl>
        <Lbl x={92.9} y={64.40} bold>
          ความอาญา
        </Lbl>

        <Line x0={24.50} x1={180.0} y={73.20} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="ผู้ร้อง" />
        <Lbl x={185.4} y={73.20}>
          ผู้ร้อง
        </Lbl>

        <Lbl x={42.9} y={82.00}>
          ข้าพเจ้า
        </Lbl>
        <Line x0={55.00} x1={92.0} y={82.00} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="ข้าพเจ้า" />
        <Lbl x={99.0} y={82.00}>
          ตำแหน่ง
        </Lbl>
        <Line x0={115.00} x1={193.38} y={82.00} value={fields.position} onChange={(v) => onChange("position", v)} aria="ตำแหน่ง" />

        <Lbl x={24.5} y={90.80}>
          อายุ
        </Lbl>
        <Line x0={32.60} x1={43.0} y={90.80} value={fields.age} onChange={(v) => onChange("age", v)} aria="อายุ" />
        <Lbl x={45.0} y={90.80}>
          ปี อาชีพ
        </Lbl>
        <Line x0={60.50} x1={80.0} y={90.80} value={fields.occupation} onChange={(v) => onChange("occupation", v)} aria="อาชีพ" />
        <Lbl x={84.0} y={90.80}>
          รับราชการ
        </Lbl>
        <Line x0={100.70} x1={130.0} y={90.80} value={fields.dept} onChange={(v) => onChange("dept", v)} aria="รับราชการ" />
        <Lbl x={134.0} y={90.80}>
          สถานที่ทำงาน
        </Lbl>
        <Line x0={159.20} x1={193.38} y={90.80} value={fields.workplace} onChange={(v) => onChange("workplace", v)} aria="สถานที่ทำงาน" />

        <Lbl x={24.5} y={99.60}>
          ตำบล/แขวง
        </Lbl>
        <Line x0={43.10} x1={68.0} y={99.60} value={fields.addrSubDistrict} onChange={(v) => onChange("addrSubDistrict", v)} aria="ตำบลแขวง" />
        <Lbl x={70.4} y={99.60}>
          อำเภอ/เขต
        </Lbl>
        <Line x0={89.00} x1={120.0} y={99.60} value={fields.addrDistrict} onChange={(v) => onChange("addrDistrict", v)} aria="อำเภอเขต" />
        <Lbl x={142.9} y={99.60}>
          จังหวัด
        </Lbl>
        <Line x0={157.70} x1={193.38} y={99.60} value={fields.addrProvince} onChange={(v) => onChange("addrProvince", v)} aria="จังหวัด" />

        <Lbl x={24.5} y={108.40}>
          โทรศัพท์
        </Lbl>
        <Line x0={41.20} x1={193.38} y={108.40} value={fields.phone} onChange={(v) => onChange("phone", v)} aria="โทรศัพท์" />

        <Lbl x={24.5} y={117.20} nowrap={false}>
          ขอยื่นคำร้องขอออกหมายจับต่อศาล มีข้อความตามที่จะกล่าวดังนี้
        </Lbl>

        <Lbl x={42.9} y={126.00}>
          ข้อ ๑. ด้วย
        </Lbl>
        <Line x0={63.00} x1={193.38} y={126.00} value={fields.clause1Text} onChange={(v) => onChange("clause1Text", v)} aria="ข้อ ๑. ด้วย" />
        <Lbl x={24.5} y={134.80}>
          มาแจ้งความร้องทุกข์ต่อพนักงานสอบสวน
        </Lbl>
        <Line x0={92.50} x1={193.38} y={134.80} value={fields.complaintText} onChange={(v) => onChange("complaintText", v)} aria="ผู้มาแจ้ง" />

        <Lbl x={42.9} y={143.60} nowrap={false}>
          ปรากฏจากการสืบสวนสอบสวน ของ
        </Lbl>
        <AutoLinedField
          k="arr1-invest"
          aria="พนักงานสอบสวน"
          value={fields.investigationText}
          onChange={(v) => onChange("investigationText", v)}
          left={24.5}
          top={144.3}
          width={168.88}
          minLines={2}
          indent={83}
          firstLeft={107.5}
          firstWidth={85.88}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={161.20}>
          ว่า
        </Lbl>
        <Lbl x={30.3} y={161.20}>
          นาย/นาง/นางสาว
        </Lbl>
        <Line x0={57.0} x1={193.38} y={161.20} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="ผู้ต้องหา" />

        <Lbl x={24.5} y={170.00}>
          อายุ
        </Lbl>
        <Line x0={33.60} x1={43.0} y={170.00} value={fields.suspectAge} onChange={(v) => onChange("suspectAge", v)} aria="อายุ" />
        <Lbl x={45.0} y={170.00}>
          ปี เชื้อชาติ
        </Lbl>
        <Line x0={69.30} x1={80.0} y={170.00} value={fields.suspectEthnicity} onChange={(v) => onChange("suspectEthnicity", v)} aria="เชื้อชาติ" />
        <Lbl x={90.0} y={170.00}>
          สัญชาติ
        </Lbl>
        <Line x0={104.80} x1={120.0} y={170.00} value={fields.suspectNationality} onChange={(v) => onChange("suspectNationality", v)} aria="สัญชาติ" />
        <Lbl x={138.0} y={170.00}>
          อาชีพ
        </Lbl>
        <Line x0={149.00} x1={193.38} y={170.00} value={fields.suspectOccupation} onChange={(v) => onChange("suspectOccupation", v)} aria="อาชีพผู้ต้องหา" />

        <Lbl x={24.5} y={178.80}>
          อยู่บ้านเลขที่
        </Lbl>
        <Line x0={52.60} x1={110.0} y={178.80} value={fields.suspectHouseNo} onChange={(v) => onChange("suspectHouseNo", v)} aria="บ้านเลขที่" />
        <Lbl x={113.0} y={178.80}>
          หมู่ที่
        </Lbl>
        <Line x0={127.80} x1={133.0} y={178.80} value={fields.suspectMoo} onChange={(v) => onChange("suspectMoo", v)} aria="หมู่ที่" />
        <Lbl x={138.0} y={178.80}>
          ถนน
        </Lbl>
        <Line x0={145.0} x1={193.38} y={178.80} value={fields.suspectRoad} onChange={(v) => onChange("suspectRoad", v)} aria="ถนน" />

        <Lbl x={24.5} y={187.60}>
          ตรอก/ซอย
        </Lbl>
        <Line x0={41.20} x1={80.0} y={187.60} value={fields.suspectAlley} onChange={(v) => onChange("suspectAlley", v)} aria="ตรอกซอย" />
        <Lbl x={85.4} y={187.60}>
          ใกล้เคียง
        </Lbl>
        <Line x0={104.00} x1={130.0} y={187.60} value={fields.suspectNear} onChange={(v) => onChange("suspectNear", v)} aria="ใกล้เคียง" />
        <Lbl x={138.0} y={187.60}>
          ตำบล/แขวง
        </Lbl>
        <Line x0={156.60} x1={193.38} y={187.60} value={fields.suspectSubDistrict} onChange={(v) => onChange("suspectSubDistrict", v)} aria="ตำบลแขวง" />

        <Lbl x={24.5} y={196.40}>
          อำเภอ/เขต
        </Lbl>
        <Line x0={43.10} x1={80.0} y={196.40} value={fields.suspectDistrict} onChange={(v) => onChange("suspectDistrict", v)} aria="อำเภอเขต" />
        <Lbl x={85.4} y={196.40}>
          จังหวัด
        </Lbl>
        <Line x0={100.20} x1={130.0} y={196.40} value={fields.suspectProvince} onChange={(v) => onChange("suspectProvince", v)} aria="จังหวัด" />
        <Lbl x={138.0} y={196.40}>
          โทรศัพท์
        </Lbl>
        <Line x0={154.70} x1={193.38} y={196.40} value={fields.suspectPhone} onChange={(v) => onChange("suspectPhone", v)} aria="โทรศัพท์ผู้ต้องหา" />

        <Lbl x={24.5} y={205.20} nowrap={false}>
          ซึ่งมีตำหนิรูปพรรณตามที่แนบมาพร้อมนี้
        </Lbl>

        <Lbl x={42.9} y={214.00} nowrap={false}>
          ได้หรือน่าจะได้กระทำความผิดอาญาร้ายแรงซึ่งมีอัตราโทษจำคุกอย่างสูงเกิน ๓ ปี
        </Lbl>
        <Lbl x={42.9} y={222.80} nowrap={false}>
          ได้หรือน่าจะได้กระทำความผิดอาญา และน่าจะหลบหนีหรือจะไปยุ่งเหยิงกับพยานหลักฐานหรือ
        </Lbl>
        <Lbl x={42.9} y={231.60}>
          ก่ออันตรายประการอื่น
        </Lbl>

        <Lbl x={24.5} y={240.40}>
          เหตุเกิดที่
        </Lbl>
        <Line x0={46.90} x1={120.0} y={240.40} value={fields.incidentPlace} onChange={(v) => onChange("incidentPlace", v)} aria="เหตุเกิดที่" />

        <Lbl x={24.5} y={249.20}>
          เมื่อวันที่
        </Lbl>
        <Line x0={46.90} x1={55.0} y={249.20} value={fields.incidentDay} onChange={(v) => onChange("incidentDay", v)} aria="เกิดวันที่" />
        <Lbl x={56.0} y={249.20}>
          เดือน
        </Lbl>
        <Line x0={67.00} x1={80.0} y={249.20} value={fields.incidentMonth} onChange={(v) => onChange("incidentMonth", v)} aria="เกิดเดือน" />
        <Lbl x={81.0} y={249.20}>
          พุทธศักราช
        </Lbl>
        <Line x0={101.50} x1={115.0} y={249.20} value={fields.incidentYear} onChange={(v) => onChange("incidentYear", v)} aria="เกิดปี" />
        <Lbl x={116.0} y={249.20}>
          เวลา
        </Lbl>
        <Line x0={125.0} x1={150.0} y={249.20} value={fields.incidentTime} onChange={(v) => onChange("incidentTime", v)} aria="เกิดเวลา" />
        <Lbl x={151.0} y={249.20}>
          น.
        </Lbl>
      </Sheet>

      <Sheet index={1}>
        <ExtraLines page={1} />
        <Lbl x={103.0} y={17}>
          ๒
        </Lbl>

        <Lbl x={24.5} y={28.2} nowrap={false}>
          มีพฤติการณ์กระทำความผิด...นี้เกี่ยวกับคดีออกหมายจับข้อใด
        </Lbl>
        <AutoLinedField
          k="arr2-narrative"
          aria="พฤติการณ์"
          value={fields.narrative2}
          onChange={(v) => onChange("narrative2", v)}
          left={24.5}
          top={34.8}
          width={168.88}
          minLines={7}
          firstLeft={24.5}
          firstWidth={168.88}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={96.40}>
          เป็นการกระทำความผิดฐาน
        </Lbl>
        <Line x0={66.00} x1={193.38} y={96.40} value={fields.offenseBase} onChange={(v) => onChange("offenseBase", v)} aria="ฐานความผิด" />
        <Lbl x={24.5} y={105.20}>
          ตามกฎหมาย
        </Lbl>
        <Line x0={50.00} x1={193.38} y={105.20} value={fields.lawRef} onChange={(v) => onChange("lawRef", v)} aria="ตามกฎหมาย" />
        <Lbl x={24.5} y={114.00} nowrap={false}>
          รายละเอียดและข้อมูลพยานหลักฐาน ปรากฏตามเอกสารที่แนบมาพร้อมนี้
        </Lbl>

        <Lbl x={24.5} y={122.80} nowrap={false}>
          ข้อ ๒. ผู้ร้องประสงค์จะทำการจับกุม
        </Lbl>
        <Line x0={94.00} x1={150.00} y={122.80} value={fields.arrestFrom} onChange={(v) => onChange("arrestFrom", v)} aria="จับกุม" />
        <Lbl x={151.0} y={122.80}>
          นาฬิกา ถึง เวลา
        </Lbl>
        <Line x0={182.00} x1={193.38} y={122.80} value={fields.arrestTo} onChange={(v) => onChange("arrestTo", v)} aria="ถึงเวลา" />

        <Lbl x={24.5} y={131.60}>
          จึงขอให้ศาลออกหมายจับ
        </Lbl>
        <Line x0={70.00} x1={193.38} y={131.60} value={fields.arrestPlace} onChange={(v) => onChange("arrestPlace", v)} aria="ออกหมายจับ" />

        <Lbl x={24.5} y={140.40} nowrap={false}>
          ในการยื่นคำร้องนี้ ผู้ร้องได้มอบหมายให้
        </Lbl>
        <Line x0={85.00} x1={150.00} y={140.40} value={fields.assignee2} onChange={(v) => onChange("assignee2", v)} aria="มอบหมายให้" />

        <Lbl x={24.5} y={149.20}>
          ตำแหน่ง
        </Lbl>
        <Line x0={40.00} x1={110.00} y={149.20} value={fields.assigneePosition2} onChange={(v) => onChange("assigneePosition2", v)} aria="ตำแหน่ง" />
        <Lbl x={111.0} y={149.20}>
          ซึ่งเป็นผู้ใต้บังคับบัญชา
        </Lbl>

        <Lbl x={24.5} y={158.00} nowrap={false}>
          เป็นผู้นำคำร้องนี้ยื่นต่อศาล และหากศาลเรียกสอบถามเมื่อใด ผู้ร้องพร้อมจะมาให้ศาลสอบปากคำได้ทันที
        </Lbl>

        <Lbl x={84.0} y={166.80}>
          ผู้ร้อง
        </Lbl>
        <CheckBox x={100.0} y={166.80} checked={fields.priorRequest2} onToggle={() => onChange("priorRequest2", true)} label="เคย" />
        <CheckBox x={122.0} y={166.80} checked={!fields.priorRequest2} onToggle={() => onChange("priorRequest2", false)} label="ไม่เคย" />
        <Lbl x={144.0} y={166.80}>
          ร้องขอให้ศาล
        </Lbl>
        <Line x0={166.00} x1={193.38} y={166.80} value={fields.priorRequestText2} onChange={(v) => onChange("priorRequestText2", v)} aria="ร้องขอให้ศาล" />

        <Lbl x={24.5} y={175.60} nowrap={false}>
          ออกหมายจับบุคคลดังกล่าว โดยอาศัยเหตุแห่งการร้องขอดังกล่าวนี้ หรือเหตุอื่น
        </Lbl>
        <AutoLinedField
          k="arr2-reason"
          aria="เหตุแห่งการร้องขอ"
          value={fields.reason2}
          onChange={(v) => onChange("reason2", v)}
          left={24.5}
          top={178.2}
          width={168.88}
          minLines={3}
          firstLeft={24.5}
          firstWidth={168.88}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={208.80}>
          และศาลมีคำสั่ง
        </Lbl>
        <AutoLinedField
          k="arr2-order"
          aria="คำสั่งศาล"
          value={fields.courtOrder2}
          onChange={(v) => onChange("courtOrder2", v)}
          left={24.5}
          top={209.5}
          width={168.88}
          minLines={2}
          indent={31.5}
          firstLeft={56}
          firstWidth={137.38}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={234.20}>
          ควรมีการแล้วแต่จะโปรด
        </Lbl>

        <Lbl x={60.0} y={243.00}>
          ลงชื่อ
        </Lbl>
        <Line x0={75.00} x1={120.00} y={243.00} value={fields.signApplicant} onChange={(v) => onChange("signApplicant", v)} aria="ลงชื่อผู้ร้อง" />
        <Lbl x={121.0} y={243.00}>
          ผู้ร้อง
        </Lbl>

        <Lbl x={24.5} y={251.80} nowrap={false}>
          คำร้องฉบับนี้ ข้าพเจ้า
        </Lbl>
        <Line x0={62.00} x1={110.00} y={251.80} value={fields.writerName} onChange={(v) => onChange("writerName", v)} aria="ผู้เรียงพิมพ์" />
        <Lbl x={111.0} y={251.80}>
          หมายเลขโทรศัพท์ของข้าพเจ้า
        </Lbl>
        <Line x0={168.00} x1={181.00} y={251.80} value={fields.writerPhone} onChange={(v) => onChange("writerPhone", v)} aria="โทรศัพท์ผู้เรียง" />
        <Lbl x={182.0} y={251.80}>
          เป็นผู้เรียงและพิมพ์
        </Lbl>

        <Lbl x={60.0} y={260.60}>
          ลงชื่อ
        </Lbl>
        <Line x0={75.00} x1={120.00} y={260.60} value={fields.signWriter} onChange={(v) => onChange("signWriter", v)} aria="ลงชื่อผู้เรียง" />
        <Lbl x={121.0} y={260.60}>
          ผู้เรียง/พิมพ์
        </Lbl>
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
