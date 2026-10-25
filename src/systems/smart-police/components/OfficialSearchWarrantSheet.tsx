"use client";

import { type CSSProperties, type ReactNode } from "react";
import { type SearchWarrantFields } from "@/lib/smart-police/form-templates/search-warrant";

const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 20;
const HEAD = 22;
const LINE = 7.76;
const RULE_DY = 6.2;

function topFor(y: number, size: number): number {
  return y + 0.1227 * size - 1.267;
}

const PROSE: CSSProperties = {
  position: "absolute",
  lineHeight: `${LINE}mm`,
};

function Lbl({
  x,
  y,
  children,
  size = BODY,
  bold = false,
  center,
  nowrap = true,
}: {
  x?: number;
  y: number;
  children: ReactNode;
  size?: number;
  bold?: boolean;
  center?: boolean;
  nowrap?: boolean;
}) {
  return (
    <span
      style={{
        ...PROSE,
        top: `${topFor(y, size).toFixed(2)}mm`,
        fontSize: `${size}pt`,
        fontWeight: bold ? 700 : 400,
        whiteSpace: nowrap ? "nowrap" : "normal",
        ...(center ? { left: 0, right: 0, textAlign: "center" } : { left: `${(x ?? 0).toFixed(2)}mm` }),
      }}
    >
      {children}
    </span>
  );
}

function Line({
  label,
  labelX,
  x0,
  x1,
  y,
  value,
  onChange,
  aria,
}: {
  label?: string;
  labelX?: number;
  x0: number;
  x1: number;
  y: number;
  value: string;
  onChange: (v: string) => void;
  aria: string;
}) {
  return (
    <>
      {label ? (
        <Lbl x={labelX ?? x0} y={y}>
          {label}
        </Lbl>
      ) : null}
      <span
        className="sp-rule-cell"
        style={{
          position: "absolute",
          left: `${x0.toFixed(2)}mm`,
          top: `${(y + 0.7).toFixed(2)}mm`,
          width: `${Math.max(2, x1 - x0).toFixed(2)}mm`,
          height: `${RULE_DY.toFixed(2)}mm`,
          borderBottom: "0.5pt dotted #111",
          boxSizing: "border-box",
        }}
      >
        <input
          aria-label={aria}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="sp-bare-field"
          style={{
            display: "block",
            width: "100%",
            minWidth: 0,
            height: `${LINE.toFixed(2)}mm`,
            marginTop: `${(RULE_DY - LINE).toFixed(2)}mm`,
            fontFamily: FONT,
            fontSize: `${BODY}pt`,
            lineHeight: `${LINE.toFixed(2)}mm`,
            boxSizing: "border-box",
            padding: 0,
            textAlign: "left",
            textIndent: "4mm",
          }}
        />
      </span>
    </>
  );
}

function CheckBox({
  x,
  y,
  checked,
  onToggle,
  label,
}: {
  x: number;
  y: number;
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      style={{
        position: "absolute",
        left: `${x.toFixed(2)}mm`,
        top: `${(y - 1.0).toFixed(2)}mm`,
        display: "flex",
        alignItems: "flex-start",
        gap: "2.2mm",
        padding: 0,
        border: "none",
        background: "transparent",
        font: "inherit",
        fontSize: `${BODY}pt`,
        lineHeight: `${LINE}mm`,
        color: "#111",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "4.2mm",
          height: "4.2mm",
          marginTop: "1.1mm",
          flexShrink: 0,
          border: "0.5pt solid #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10pt",
          lineHeight: 1,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span>{label}</span>
    </button>
  );
}

function Sheet({ children }: { children: ReactNode }) {
  return (
    <article
      data-sheet-index={0}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: `${PAGE_W}mm`,
        height: `${PAGE_H}mm`,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        fontFamily: FONT,
        fontSize: `${BODY}pt`,
        lineHeight: `${LINE}mm`,
        color: "#111",
      }}
    >
      {children}
    </article>
  );
}

export function OfficialSearchWarrantDocument({
  fields,
  onChange,
}: {
  fields: SearchWarrantFields;
  onChange: <K extends keyof SearchWarrantFields>(key: K, value: SearchWarrantFields[K]) => void;
}) {
  const toggle = (key: keyof SearchWarrantFields) => () => onChange(key, !fields[key] as never);

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
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

        <Line labelX={103.2} label="ศาล" x0={111.0} x1={150.0} y={55.6} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Line labelX={95.0} label="วันที่" x0={105.0} x1={120.0} y={63.6} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={120.0} label="เดือน" x0={128.0} x1={143.0} y={63.6} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={143.0} label="พุทธศักราช" x0={158.0} x1={193.38} y={63.6} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={25.5} y={71.3}>
          ความอาญา
        </Lbl>
        <Line x0={43.0} x1={90.0} y={71.3} value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} aria="ความอาญา" />

        <Lbl x={25.5} y={80.8}>
          ผู้ร้อง
        </Lbl>
        <Line x0={40.30} x1={193.38} y={80.8} value={fields.petitioner} onChange={(v) => onChange("petitioner", v)} aria="ผู้ร้อง" />

        <Lbl x={25.5} y={91.1}>
          หมายถึง
        </Lbl>
        <Line x0={40.30} x1={110.0} y={91.1} value={fields.address} onChange={(v) => onChange("address", v)} aria="หมายถึง" />

        <Lbl x={43.2} y={101.8}>
          ด้วยศาลเห็นมีเหตุสมควรให้ค้นสถานที่/บ้านเลขที่
        </Lbl>
        <Line x0={132.10} x1={193.38} y={101.8} value={fields.searchPlace} onChange={(v) => onChange("searchPlace", v)} aria="สถานที่ค้น" />
        <Lbl x={173.2} y={101.8}>
          หมู่ที่
        </Lbl>
        <Line x0={188.00} x1={193.38} y={101.8} value={fields.moo} onChange={(v) => onChange("moo", v)} aria="หมู่ที่" />

        <Line labelX={23.2} label="ตรอก/ซอย" x0={38.0} x1={78.0} y={109.5} value={fields.alley} onChange={(v) => onChange("alley", v)} aria="ตรอกซอย" />
        <Line labelX={80.7} label="ถนน" x0={88.0} x1={131.0} y={109.5} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={133.2} label="ตำบล/แขวง" x0={152.0} x1={193.38} y={109.5} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="ตำบลแขวง" />

        <Line labelX={23.2} label="อำเภอ/เขต" x0={40.0} x1={78.0} y={117.3} value={fields.district} onChange={(v) => onChange("district", v)} aria="อำเภอเขต" />
        <Line labelX={78.2} label="จังหวัด" x0={89.0} x1={133.0} y={117.3} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />
        <Lbl x={133.2} y={117.3} nowrap={false}>
          ตามแผนที่สังเขปแนบท้าย
        </Lbl>

        <CheckBox x={23.2} y={125.1} checked={fields.ground1} onToggle={toggle("ground1")} label="เพื่อพบและยึดสิ่งของ*" />
        <CheckBox x={35.7} y={132.8} checked={fields.ground1_1} onToggle={toggle("ground1_1")} label="ซึ่งจะเป็นพยานหลักฐานประกอบการสอบสวน ไต่สวนมูลฟ้องหรือพิจารณา" />
        <CheckBox x={35.7} y={140.6} checked={fields.ground1_2} onToggle={toggle("ground1_2")} label="ซึ่งมีไว้เป็นความผิดหรือได้มาโดยผิดกฎหมาย หรือได้ใช้ หรือตั้งใจจะใช้ในการกระทำความผิด" />
        <CheckBox x={35.7} y={148.3} checked={fields.ground1_3} onToggle={toggle("ground1_3")} label="ตามคำพิพากษาหรือคำสั่งของศาล" />
        <CheckBox x={23.2} y={156.1} checked={fields.ground2} onToggle={toggle("ground2")} label="เพื่อพบ*" />
        <CheckBox x={35.7} y={163.9} checked={fields.ground2_1} onToggle={toggle("ground2_1")} label="บุคคลที่ถูกหน่วงเหนี่ยวหรือกักขังโดยมิชอบด้วยกฎหมาย" />
        <CheckBox x={35.7} y={171.6} checked={fields.ground2_2} onToggle={toggle("ground2_2")} label="บุคคลที่ถูกออกหมายจับ ตามหมายจับเลขที่" />
        <Line x0={114.0} x1={122.0} y={171.6} value={fields.warrantNo} onChange={(v) => onChange("warrantNo", v)} aria="หมายจับเลขที่" />
        <Lbl x={124.0} y={171.6}>
          / ลงวันที่
        </Lbl>
        <Line x0={144.0} x1={156.0} y={171.6} value={fields.warrantDate} onChange={(v) => onChange("warrantDate", v)} aria="ลงวันที่" />
        <Lbl x={64.5} y={179.4}>
          ซึ่งออกโดย
        </Lbl>
        <Line x0={85.00} x1={120.0} y={179.4} value={fields.warrantBy} onChange={(v) => onChange("warrantBy", v)} aria="ออกโดย" />

        <Lbl x={43.2} y={187.1}>
          จึงออกหมายค้นนี้ตามข้อ
        </Lbl>
        <Line x0={86.50} x1={78.0} y={187.1} value={fields.orderNo} onChange={(v) => onChange("orderNo", v)} aria="ตามข้อ" />
        <Lbl x={80.0} y={187.1}>
          ให้
        </Lbl>
        <Line x0={87.0} x1={115.0} y={187.1} value={fields.officerName} onChange={(v) => onChange("officerName", v)} aria="ผู้มีอำนาจ" />

        <Line labelX={23.2} label="ตำแหน่ง" x0={38.0} x1={110.0} y={194.9} value={fields.position} onChange={(v) => onChange("position", v)} aria="ตำแหน่ง" />
        <Lbl x={140.7} y={194.9} nowrap={false}>
          มีอำนาจค้นสถานที่/บ้านข้างต้นได้
        </Lbl>

        <Lbl x={23.2} y={202.7}>
          ในวันที่
        </Lbl>
        <Line x0={39.90} x1={42.0} y={202.7} value={fields.searchDay} onChange={(v) => onChange("searchDay", v)} aria="ค้นวันที่" />
        <Lbl x={44.0} y={202.7}>
          เดือน
        </Lbl>
        <Line x0={55.00} x1={64.0} y={202.7} value={fields.searchMonth} onChange={(v) => onChange("searchMonth", v)} aria="ค้นเดือน" />
        <Lbl x={66.0} y={202.7}>
          พ.ศ.
        </Lbl>
        <Line x0={74.0} x1={86.0} y={202.7} value={fields.searchYear} onChange={(v) => onChange("searchYear", v)} aria="ค้นปี" />
        <Lbl x={88.0} y={202.7}>
          เวลา
        </Lbl>
        <Line x0={97.0} x1={115.0} y={202.7} value={fields.searchTime} onChange={(v) => onChange("searchTime", v)} aria="เวลาค้น" />
        <Lbl x={117.0} y={202.7}>
          นาฬิกา ถึง เวลา
        </Lbl>
        <Line x0={147.0} x1={165.0} y={202.7} value={fields.searchTime2} onChange={(v) => onChange("searchTime2", v)} aria="เวลาถึง" />
        <Lbl x={167.0} y={202.7}>
          นาฬิกา
        </Lbl>

        <Lbl x={70.7} y={210.4} nowrap={false}>
          ติดต่อกันไปจนกว่าจะเสร็จสิ้นการตรวจค้น
        </Lbl>
        <CheckBox x={23.2} y={211.6} checked={fields.dayTime} onToggle={toggle("dayTime")} label="เวลากลางวัน" />
        <CheckBox x={84.6} y={211.6} checked={fields.nightTime} onToggle={toggle("nightTime")} label="เวลากลางคืน" />

        <Lbl x={23.2} y={218.2}>
          เมื่อค้นได้ตามหมายนี้แล้วให้ส่ง
        </Lbl>
        <Line x0={83.60} x1={150.0} y={218.2} value={fields.itemsToSend} onChange={(v) => onChange("itemsToSend", v)} aria="สิ่งของที่ส่ง" />

        <Lbl x={23.2} y={233.7} nowrap={false}>
          พร้อมบันทึกการค้นและบัญชีสิ่งของ (ถ้ามี) ไปยัง
        </Lbl>
        <Line x0={112.10} x1={120.0} y={233.7} value={fields.sendTo} onChange={(v) => onChange("sendTo", v)} aria="ไปยัง" />

        <Lbl x={23.2} y={241.5}>
          เพื่อจัดการตามกฎหมายต่อไป
        </Lbl>

        <Lbl x={165.7} y={257.0}>
          ผู้พิพากษา
        </Lbl>

        <Lbl x={25.7} y={277.7} nowrap={false}>
          หมายเหตุ: * ให้ระบุชื่อหรือรูปพรรณบุคคลหรือลักษณะสิ่งของที่ต้องการค้น
        </Lbl>
      </Sheet>
    </div>
  );
}
