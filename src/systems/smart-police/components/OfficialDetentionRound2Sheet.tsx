"use client";

import { useContext } from "react";
import { type DetentionRound2Fields } from "@/lib/smart-police/form-templates/detention-round2";
import { emptySheetLayout, type SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";
import { ExtraLines, Lbl, Line, Sheet, SheetCtx } from "@/systems/smart-police/components/OfficialSearchWarrantRequestSheet";

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

export function OfficialDetentionRound2Document({
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
  fields: DetentionRound2Fields;
  onChange: <K extends keyof DetentionRound2Fields>(key: K, value: DetentionRound2Fields[K]) => void;
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
    <SheetCtx.Provider
      value={{ layout, edit, onDragStart, onResizeStart, onTextChange, onToggleHidden, onLineDrag, onLineResize, onDeleteExtra }}
    >
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

          <Lbl x={25.8} y={26.5} bold>
            คำร้องขอฝากขังผู้ต้องหา
          </Lbl>
          <Lbl x={25.8} y={33.9} bold>
            ครั้งที่ ๒
          </Lbl>

          <Lbl x={130.4} y={38.3}>
            คำร้องที่
          </Lbl>
          <Line x0={143.7} x1={174.3} y={38.3} value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} aria="คำร้องที่" />
          <Lbl x={174.6} y={38.3}>
            /๒๕
          </Lbl>
          <Line x0={181.0} x1={193.3} y={38.3} value={fields.caseNoYear} onChange={(v) => onChange("caseNoYear", v)} aria="ปีคำร้อง" />

          <Lbl x={102.9} y={51.3}>
            ศาล
          </Lbl>
          <Line x0={109.0} x1={193.3} y={51.3} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

          <Lbl x={95.0} y={59.1}>
            วันที่
          </Lbl>
          <Line x0={101.6} x1={118.7} y={59.1} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
          <Lbl x={120.0} y={59.1}>
            เดือน
          </Lbl>
          <Line x0={129.0} x1={156.8} y={59.1} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
          <Lbl x={158.0} y={59.1}>
            พุทธศักราช ๒๕
          </Lbl>

          <Lbl x={92.9} y={66.9} bold>
            ความอาญา
          </Lbl>

          <Lbl x={24.5} y={91.0}>
            ระหว่าง
          </Lbl>
          <Brace left={40} top={73.2} height={36} />
          <Line x0={44.1} x1={180.4} y={79.9} value={fields.partyBetweenA} onChange={(v) => onChange("partyBetweenA", v)} aria="ระหว่างผู้ร้อง" />
          <Lbl x={181.2} y={79.9}>
            ผู้ร้อง
          </Lbl>
          <Line x0={44.1} x1={180.4} y={102.9} value={fields.partyBetweenB} onChange={(v) => onChange("partyBetweenB", v)} aria="ระหว่างผู้ต้องหา" />
          <Lbl x={181.2} y={102.9}>
            ผู้ต้องหา
          </Lbl>

          <Lbl x={43.9} y={109.9}>
            อยู่บ้านเลขที่
          </Lbl>
          <Line x0={63.5} x1={193.3} y={109.9} value={fields.homeAddress} onChange={(v) => onChange("homeAddress", v)} aria="อยู่บ้านเลขที่" />

          <Lbl x={43.9} y={116.9}>
            บัตรประจำตัวประชาชนเลขที่
          </Lbl>
          <Line x0={88.5} x1={193.3} y={116.9} value={fields.idCard} onChange={(v) => onChange("idCard", v)} aria="บัตรประชาชน" />

          <Lbl x={43.9} y={123.9}>
            ข้าพเจ้า
          </Lbl>
          <Line x0={56.5} x1={181.5} y={123.9} value={fields.requesterName} onChange={(v) => onChange("requesterName", v)} aria="ข้าพเจ้า" />
          <Lbl x={183.4} y={123.9}>
            ผู้ร้อง
          </Lbl>

          <Lbl x={25.8} y={133.0}>
            ขอยื่นคำร้องต่อศาลมีข้อความตามที่จะกล่าวต่อไปนี้
          </Lbl>

          {/* ข้อ ๑ */}
          <Lbl x={50.8} y={141.8}>
            ข้อ ๑. ตามคำร้องที่
          </Lbl>
          <Line x0={86.0} x1={114.0} y={141.8} value={fields.p1RefNo} onChange={(v) => onChange("p1RefNo", v)} aria="คำร้องที่อ้าง" />
          <Lbl x={115.5} y={141.8}>
            ลงวันที่
          </Lbl>
          <Line x0={134.0} x1={162.0} y={141.8} value={fields.p1RefDate} onChange={(v) => onChange("p1RefDate", v)} aria="ลงวันที่อ้าง" />
          <Lbl x={163.2} y={141.8}>
            ซึ่งศาลได้ประทาน
          </Lbl>

          <Lbl x={25.4} y={150.6}>
            อนุญาตให้ผู้ต้องหานี้ไว้เป็นครั้งที่
          </Lbl>
          <Line x0={102.0} x1={126.0} y={150.6} value={fields.p1Round} onChange={(v) => onChange("p1Round", v)} aria="อนุญาตครั้งที่" />
          <Lbl x={127.5} y={150.6}>
            มีกำหนด
          </Lbl>
          <Line x0={148.0} x1={170.0} y={150.6} value={fields.p1Days} onChange={(v) => onChange("p1Days", v)} aria="กำหนดวันเดิม" />
          <Lbl x={171.2} y={150.6}>
            วัน
          </Lbl>

          <Lbl x={25.4} y={159.5}>
            และจะครบกำหนดผู้ต้องหาในวันที่
          </Lbl>
          <Line x0={95.0} x1={127.0} y={159.5} value={fields.p1DueDate} onChange={(v) => onChange("p1DueDate", v)} aria="ครบกำหนดวันที่" />
          <Lbl x={128.5} y={159.5}>
            นี้แล้วนั้น
          </Lbl>

          {/* ข้อ ๒ */}
          <Lbl x={50.8} y={168.3}>
            ข้อ ๒. พนักงานสอบสวนได้ทำการสอบสวนคดีนี้ตลอดมา
          </Lbl>

          <Lbl x={25.4} y={177.1}>
            แล้ว หากแต่การสอบสวนยังไม่เสร็จสิ้น โดยจะต้อง
          </Lbl>
          <Line x0={110.0} x1={193.3} y={177.1} value={fields.p2Must} onChange={(v) => onChange("p2Must", v)} aria="โดยจะต้อง" />

          <Lbl x={25.4} y={185.9}>
            ด้วยความจำเป็นดังกล่าว จึงขอฝากขังผู้ต้องหานี้ต่อไปอีกเป็นครั้งที่
          </Lbl>
          <Line x0={135.0} x1={160.0} y={185.9} value={fields.p2Round} onChange={(v) => onChange("p2Round", v)} aria="ฝากขังครั้งที่" />
          <Lbl x={161.5} y={185.9}>
            มีกำหนด
          </Lbl>
          <Line x0={181.0} x1={193.3} y={185.9} value={fields.p2Days} onChange={(v) => onChange("p2Days", v)} aria="กำหนดวันใหม่" />

          <Lbl x={25.4} y={194.7}>
            วัน นับแต่วันที่
          </Lbl>
          <Line x0={58.0} x1={88.0} y={194.7} value={fields.p2From} onChange={(v) => onChange("p2From", v)} aria="นับแต่วันที่" />
          <Lbl x={89.5} y={194.7}>
            ถึงวันที่
          </Lbl>
          <Line x0={112.0} x1={142.0} y={194.7} value={fields.p2To} onChange={(v) => onChange("p2To", v)} aria="ถึงวันที่" />
          <Lbl x={143.2} y={194.7}>
            นี้
          </Lbl>

          <Lbl x={88.9} y={203.6}>
            ควรมิควรแล้วแต่จะโปรด
          </Lbl>

          <Lbl x={76.2} y={212.4}>
            ลงชื่อ
          </Lbl>
          <Line x0={95.0} x1={148.0} y={212.4} value={fields.requesterName} onChange={(v) => onChange("requesterName", v)} aria="ลงชื่อผู้ร้อง" />
          <Lbl x={153.0} y={212.4}>
            ผู้ร้อง
          </Lbl>

          <Lbl x={38.1} y={221.2}>
            คำร้องฉบับนี้ ข้าพเจ้า
          </Lbl>
          <Line x0={94.0} x1={112.0} y={221.2} value={fields.typistName} onChange={(v) => onChange("typistName", v)} aria="ผู้เรียงพิมพ์" />
          <Lbl x={114.3} y={221.2}>
            ตำแหน่ง พนักงานสอบสวนสถานี
          </Lbl>

          <Lbl x={25.4} y={230.0}>
            ตำรวจ
          </Lbl>
          <Line x0={45.0} x1={70.0} y={230.0} value={fields.typistStation} onChange={(v) => onChange("typistStation", v)} aria="สถานีผู้เรียงพิมพ์" />
          <Lbl x={72.0} y={230.0}>
            เป็นผู้เรียง/พิมพ์
          </Lbl>

          <Lbl x={76.2} y={238.8}>
            ลงชื่อ
          </Lbl>
          <Line x0={95.0} x1={148.0} y={238.8} value={fields.typistName} onChange={(v) => onChange("typistName", v)} aria="ลงชื่อผู้เรียงพิมพ์" />
          <Lbl x={153.0} y={238.8}>
            ผู้เรียง/พิมพ์
          </Lbl>
        </Sheet>
      </div>
    </SheetCtx.Provider>
  );
}
