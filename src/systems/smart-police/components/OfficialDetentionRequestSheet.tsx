"use client";

import { useContext } from "react";
import { type DetentionRequestFields } from "@/lib/smart-police/form-templates/detention-request";
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

/** วงเล็บปีกกา — ลากย้าย/ยืดได้ในโหมดจัดหน้า */
function Brace({ left, top, height }: { left: number; top: number; height: number }) {
  const { layout, edit, onDragStart } = useContext(SheetCtx);
  const key = `brace:${left}:${top}`;
  const o = layout.offsets[key];
  const dx = o?.dx ?? 0;
  const dy = o?.dy ?? 0;
  const dh = o?.dw ?? 0;
  const h = Math.max(8, height + dh);
  return (
    <span
      aria-hidden
      data-layout-key={key}
      onPointerDown={edit && onDragStart ? (e) => onDragStart(key, e) : undefined}
      style={{
        position: "absolute",
        left: `${left + dx}mm`,
        top: `${top + dy}mm`,
        height: `${h}mm`,
        fontFamily: "serif",
        fontSize: `${h * 1.43}pt`,
        lineHeight: `${h}mm`,
        color: "#111",
        transform: "scaleX(0.55)",
        transformOrigin: "left center",
        cursor: edit ? "move" : undefined,
        userSelect: "none",
      }}
    >
      {"{"}
    </span>
  );
}


export function OfficialDetentionRequestDocument({
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
  fields: DetentionRequestFields;
  onChange: <K extends keyof DetentionRequestFields>(key: K, value: DetentionRequestFields[K]) => void;
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
  const toggle = (key: keyof DetentionRequestFields) => () => onChange(key, !fields[key] as never);

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
          style={{ position: "absolute", left: "88.6mm", top: "8mm", width: "24mm", height: "24.4mm", objectFit: "contain" }}
        />
        <CheckBox x={28.3} y={28.7} checked={fields.copyToSuspect} onToggle={toggle("copyToSuspect")} label="สำเนาให้ผู้ต้องหา" />
        <CheckBox x={28.3} y={36.4} checked={fields.summonHearing} onToggle={toggle("summonHearing")} label="เรียกไต่สวน" />
        <CheckBox x={28.3} y={44.2} checked={fields.collectInfo} onToggle={toggle("collectInfo")} label="รวบรวมข้อมูลผู้ต้องหา/ประเมินความเสี่ยง" />

        <Lbl x={118.0} y={38.4}>
          คดีหมายเลขดำที่
        </Lbl>
        <Line x0={148.00} x1={160.0} y={38.4} value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} aria="คดีหมายเลขดำที่" />

        <Lbl x={97.9} y={51.4}>
          ศาล
        </Lbl>
        <Line x0={105.0} x1={135.0} y={51.4} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Lbl x={95.0} y={59.2}>
          วันที่
        </Lbl>
        <Line x0={107.90} x1={119.0} y={59.2} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Lbl x={119.0} y={59.2}>
          เดือน
        </Lbl>
        <Line x0={130.00} x1={141.0} y={59.2} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Lbl x={141.0} y={59.2}>
          พุทธศักราช
        </Lbl>
        <Line x0={161.50} x1={193.38} y={59.2} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={92.9} y={67.0} bold>
          ความอาญา
        </Lbl>

        <Lbl x={24.5} y={94.0}>
          ระหว่าง
        </Lbl>
        <Brace left={40} top={83.5} height={28} />
        <Lbl x={180.4} y={80.0}>
          ผู้ร้อง
        </Lbl>
        <Line x0={52.0} x1={180.0} y={79.4} value={fields.partyBetweenA} onChange={(v) => onChange("partyBetweenA", v)} aria="ระหว่างผู้ร้อง" />
        <Lbl x={180.4} y={103.3}>
          ผู้ต้องหา
        </Lbl>
        <Line x0={52.0} x1={180.0} y={102.6} value={fields.partyBetweenB} onChange={(v) => onChange("partyBetweenB", v)} aria="ระหว่างผู้ต้องหา" />

        <Lbl x={42.9} y={115.9}>
          ข้าพเจ้า
        </Lbl>
        <Line x0={100.0} x1={140.0} y={116.0} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="สถานีข้าพเจ้า" />

        <Lbl x={24.5} y={124.7} nowrap={false}>
          ขอยื่นคำร้องมีข้อความตามที่จะกล่าวดังต่อไปนี้
        </Lbl>

        <Lbl x={42.6} y={133.5}>
          ข้อ ๑. ด้วยเมื่อวันที่
        </Lbl>
        <Line x0={92.10} x1={82.0} y={133.5} value={fields.incidentDay} onChange={(v) => onChange("incidentDay", v)} aria="เมื่อวันที่" />
        <Lbl x={83.0} y={133.5}>
          เวลา
        </Lbl>
        <Line x0={92.0} x1={108.0} y={133.5} value={fields.incidentTime} onChange={(v) => onChange("incidentTime", v)} aria="เวลา" />
        <Lbl x={109.0} y={133.5}>
          น. เจ้าพนักงานตำรวจประจำ
        </Lbl>
        <Line x0={156.10} x1={193.38} y={133.5} value={fields.unit} onChange={(v) => onChange("unit", v)} aria="หน่วย" />

        <Lbl x={24.5} y={142.3}>
          สถานีตำรวจ
        </Lbl>
        <Line x0={45.00} x1={100.0} y={142.3} value={fields.station2} onChange={(v) => onChange("station2", v)} aria="สถานีตำรวจ" />
        <Lbl x={100.5} y={142.3}>
          ประกอบด้วย
        </Lbl>
        <Line x0={121.00} x1={193.38} y={142.3} value={fields.officers} onChange={(v) => onChange("officers", v)} aria="ประกอบด้วย" />
        <Lbl x={180.4} y={151.2}>
          กับพวก
        </Lbl>

        <Lbl x={24.5} y={160.0} nowrap={false}>
          ได้ร่วมกันจับกุมผู้ต้องหา ชื่อ-สกุล
        </Lbl>
        <Line x0={92.50} x1={160.0} y={160.0} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="ชื่อสกุล" />
        <Lbl x={167.9} y={160.0}>
          อายุ
        </Lbl>
        <Line x0={177.00} x1={193.38} y={160.0} value={fields.suspectAge} onChange={(v) => onChange("suspectAge", v)} aria="อายุ" />
        <Lbl x={183.0} y={160.0}>
          ปี
        </Lbl>

        <Lbl x={24.5} y={168.8}>
          สัญชาติ
        </Lbl>
        <Line x0={39.30} x1={70.0} y={168.8} value={fields.suspectNationality} onChange={(v) => onChange("suspectNationality", v)} aria="สัญชาติ" />
        <Lbl x={75.5} y={168.8} nowrap={false}>
          เลขประจำตัวประชาชน/เลขหนังสือเดินทาง
        </Lbl>
        <Line x0={145.40} x1={193.38} y={168.8} value={fields.suspectId} onChange={(v) => onChange("suspectId", v)} aria="เลขประชาชน" />

        <Lbl x={24.5} y={178.5}>
          ที่อยู่
        </Lbl>
        <Line x0={39.30} x1={193.38} y={178.5} value={fields.address} onChange={(v) => onChange("address", v)} aria="ที่อยู่" />

        <Lbl x={24.5} y={186.4}>
          หมายเลขโทรศัพท์
        </Lbl>
        <Line x0={54.50} x1={100.0} y={186.4} value={fields.phone} onChange={(v) => onChange("phone", v)} aria="โทรศัพท์" />

        <Lbl x={24.5} y={195.3}>
          พร้อมของกลางคือ
        </Lbl>
        <Line x0={54.50} x1={193.38} y={195.3} value={fields.evidence} onChange={(v) => onChange("evidence", v)} aria="ของกลาง" />

        <Lbl x={24.5} y={204.1} nowrap={false}>
          นำส่งพนักงานสอบสวนดำเนินคดี ส่งถึงที่ทำการของพนักงานสอบสวนสถานีตำรวจ
        </Lbl>
        <Line x0={155.20} x1={193.38} y={204.1} value={fields.station3} onChange={(v) => onChange("station3", v)} aria="สถานีนำส่ง" />

        <Lbl x={24.5} y={213.7}>
          เมื่อวันที่
        </Lbl>
        <Line x0={46.90} x1={55.0} y={213.7} value={fields.day2} onChange={(v) => onChange("day2", v)} aria="เมื่อวันที่2" />

        <Lbl x={24.5} y={222.6} nowrap={false}>
          พฤติการณ์แห่งคดี คือ
        </Lbl>
        <AutoLinedField
          k="det-circumstances"
          aria="พฤติการณ์"
          value={fields.circumstances}
          onChange={(v) => onChange("circumstances", v)}
          left={24.5}
          top={223.3}
          width={168.88}
          minLines={3}
          indent={39.5}
          firstLeft={64}
          firstWidth={129.38}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={24.5} y={248.2}>
          เหตุเกิดที่
        </Lbl>
        <Line x0={46.90} x1={120.0} y={248.2} value={fields.place} onChange={(v) => onChange("place", v)} aria="เหตุเกิดที่" />

        <Lbl x={24.5} y={257.0} nowrap={false}>
          การกระทำของผู้ต้องหาเป็นความผิดฐาน
        </Lbl>
        <Line x0={90.60} x1={193.38} y={257.0} value={fields.charge} onChange={(v) => onChange("charge", v)} aria="ข้อหา" />

        <Lbl x={24.5} y={265.8} nowrap={false}>
          ตามประมวลกฎหมายอาญา/พระราชบัญญัติ
        </Lbl>
        <Line x0={88.70} x1={193.38} y={265.8} value={fields.law} onChange={(v) => onChange("law", v)} aria="กฎหมาย" />

        <Lbl x={24.5} y={275.5}>
          อัตราโทษ
        </Lbl>
        <Line x0={41.20} x1={193.38} y={275.5} value={fields.penalty} onChange={(v) => onChange("penalty", v)} aria="อัตราโทษ" />
      </Sheet>

      <Sheet index={1}>
        <ExtraLines page={1} />
        <Lbl x={103.0} y={17}>
          ๒
        </Lbl>

        <Lbl x={24.5} y={29.0}>
          การแจ้งสิทธิแก่ผู้ต้องหา
        </Lbl>

        <CheckBox x={30.0} y={37.8} checked={fields.stageArrest} onToggle={toggle("stageArrest")} label="ชั้นจับกุม" />
        <CheckBox x={30.0} y={46.6} checked={fields.stageReceive} onToggle={toggle("stageReceive")} label="ชั้นรับตัวผู้ถูกจับ" />
        <CheckBox x={30.0} y={55.4} checked={fields.stageInterrogate} onToggle={toggle("stageInterrogate")} label="ชั้นสอบปากคำ" />

        <Lbl x={36.4} y={64.2}>
          ในชั้นสอบสวนผู้ต้องหาให้การ
        </Lbl>
        <Line x0={86.00} x1={193.38} y={64.2} value={fields.interrogationStatement} onChange={(v) => onChange("interrogationStatement", v)} aria="ให้การชั้นสอบสวน" />

        <Lbl x={36.4} y={73.0} nowrap={false} w={155}>
          ข้อ ๒. พนักงานสอบสวนได้สอบสวนเบื้องต้นแล้วเห็นว่า
        </Lbl>

        <CheckBox x={30.0} y={81.8} checked={fields.genuineSuspect} onToggle={toggle("genuineSuspect")} label="ผู้ต้องหาที่ถูกจับเป็นบุคคลผู้ถูกกล่าวหาจริง" />

        <CheckBox x={30.0} y={90.6} checked={fields.arrestByWarrant} onToggle={toggle("arrestByWarrant")} label="เป็นการจับกุมตามหมายจับของศาล" />
        <Line x0={36.40} x1={193.38} y={90.6} value={fields.warrantNo} onChange={(v) => onChange("warrantNo", v)} aria="หมายจับเลขที่" />

        <Lbl x={36.4} y={99.4}>
          ลงวันที่
        </Lbl>
        <Line x0={36.40} x1={100.0} y={99.4} value={fields.warrantDate} onChange={(v) => onChange("warrantDate", v)} aria="หมายจับลงวันที่" />

        <CheckBox x={30.0} y={108.2} checked={fields.arrestNoWarrant} onToggle={toggle("arrestNoWarrant")} label="เป็นการจับกุมโดยไม่มีหมายจับ ตาม ป.วิ.อ. มาตรา ๗๘" />

        <Lbl x={36.4} y={117.0} bold>
          เอกสารแนบท้ายคำร้อง
        </Lbl>

        <CheckBox x={30.0} y={125.8} checked={fields.docArrestRecord} onToggle={toggle("docArrestRecord")} label="สำเนาภาพถ่ายบันทึกการจับกุมของเจ้าพนักงานผู้จับ" />
        <CheckBox x={30.0} y={134.6} checked={fields.docWarrantCopy} onToggle={toggle("docWarrantCopy")} label="สำเนาหมายจับ" />
        <CheckBox x={30.0} y={143.4} checked={fields.docSignature} onToggle={toggle("docSignature")} label="สำเนาภาพถ่ายผู้ต้องหารับรองสำเนาถูกต้องโดยเจ้าพนักงานผู้จับ" />

        <CheckBox x={30.0} y={152.2} checked={fields.docIdCard} onToggle={toggle("docIdCard")} label="สำเนาภาพถ่ายบัตรประจำตัวประชาชน/สำเนาทะเบียนบ้านผู้ต้องหา" />

        <CheckBox x={30.0} y={161.0} checked={fields.docEvidence} onToggle={toggle("docEvidence")} label="พยานหลักฐานที่แสดงว่าผู้ต้องหาได้กระทำความผิด ได้แก่" />
        <AutoLinedField
          k="det-evidence-detail"
          aria="พยานหลักฐานได้แก่"
          value={fields.evidenceDetail}
          onChange={(v) => onChange("evidenceDetail", v)}
          left={24.5}
          top={161.0}
          width={168.88}
          minLines={2}
          indent={76.6}
          firstLeft={113.0}
          firstWidth={80.38}
          restLeft={24.5}
          restWidth={168.88}
        />

        <Lbl x={36.4} y={178.6} nowrap={false}>
          และมีเหตุอันควรเชื่อว่า
        </Lbl>

        <CheckBox x={30.0} y={187.4} checked={fields.escapeReason} onToggle={toggle("escapeReason")} label="ผู้ต้องหาจะหลบหนี เนื่องจาก" />
        <Line x0={98.50} x1={193.38} y={187.4} value={fields.escapeBecause} onChange={(v) => onChange("escapeBecause", v)} aria="หลบหนีเนื่องจาก" />

        <CheckBox x={30.0} y={196.2} checked={fields.tamperReason} onToggle={toggle("tamperReason")} label="ผู้ต้องหาจะไปยุ่งเหยิงกับพยานหลักฐาน เนื่องจาก" />
        <Line x0={123.50} x1={193.38} y={196.2} value={fields.tamperBecause} onChange={(v) => onChange("tamperBecause", v)} aria="ยุ่งเหยิงเนื่องจาก" />

        <CheckBox x={30.0} y={205.0} checked={fields.dangerReason} onToggle={toggle("dangerReason")} label="ผู้ต้องหาจะก่อเหตุอันตราย หรือความเสียหาย เนื่องจาก" />
        <Line x0={134.30} x1={193.38} y={205.0} value={fields.dangerBecause} onChange={(v) => onChange("dangerBecause", v)} aria="ก่อเหตุอันตรายเนื่องจาก" />

        <Lbl x={36.4} y={213.8} nowrap={false} w={143}>
          ข้อ ๓. พนักงานสอบสวนได้ทำการสอบสวนและควบคุมตัวผู้ต้องหามาจะครบ ๔๘ ชั่วโมงในวันนี้แล้ว
          แต่การสอบสวนยังไม่เสร็จสิ้น เนื่องจาก
        </Lbl>

        <CheckBox x={30.0} y={231.4} checked={fields.anotherWitness} onToggle={toggle("anotherWitness")} label="ต้องสอบสวนพยานอีก" />
        <Line x0={36.40} x1={95.0} y={231.4} value={fields.witnessCount} onChange={(v) => onChange("witnessCount", v)} aria="จำนวนพยาน" />
        <Lbl x={96.0} y={231.4}>
          ปาก
        </Lbl>
        <AutoLinedField
          k="det-witness-note"
          aria="รายละเอียดพยาน"
          value={fields.witnessNote}
          onChange={(v) => onChange("witnessNote", v)}
          left={24.5}
          top={231.4}
          width={168.88}
          minLines={2}
          indent={71.5}
          firstLeft={103.5}
          firstWidth={76}
          restLeft={24.5}
          restWidth={168.88}
        />

        <CheckBox x={30.0} y={240.2} checked={fields.waitEvidence} onToggle={toggle("waitEvidence")} label="รอผลการตรวจพิสูจน์ของกลาง" />

        <CheckBox x={30.0} y={249.0} checked={fields.waitFingerprint} onToggle={toggle("waitFingerprint")} label="รอผลการตรวจลายพิมพ์นิ้วมือผู้ต้องหาและประวัติต้องโทษของผู้ต้องหา" />

        <CheckBox x={30.0} y={257.8} checked={fields.otherReason} onToggle={toggle("otherReason")} label="อื่น ๆ" />
        <Line x0={36.40} x1={179.50} y={257.8} value={fields.otherDetail} onChange={(v) => onChange("otherDetail", v)} aria="อื่นๆ" />
      </Sheet>
    </div>
    </SheetCtx.Provider>
  );
}
