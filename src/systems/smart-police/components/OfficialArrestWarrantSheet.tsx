"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { type ArrestWarrantFields } from "@/lib/smart-police/form-templates/arrest-warrant";

const PAGE_W = 210;
const PAGE_H = 297;
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';

const BODY = 16;
const TITLE = 20;
const HEAD = 22;
const LINE = 7.76;
const RIGHT = 193.38;
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
  right,
  center,
  underline = false,
  nowrap = true,
  width,
}: {
  x?: number;
  y: number;
  children: ReactNode;
  size?: number;
  bold?: boolean;
  right?: number;
  center?: boolean;
  underline?: boolean;
  nowrap?: boolean;
  width?: number;
}) {
  return (
    <span
      style={{
        ...PROSE,
        top: `${topFor(y, size).toFixed(2)}mm`,
        fontSize: `${size}pt`,
        fontWeight: bold ? 700 : 400,
        textDecoration: underline ? "underline" : undefined,
        whiteSpace: nowrap ? "nowrap" : "normal",
        ...(center
          ? { left: 0, right: 0, textAlign: "center" }
          : right !== undefined
            ? { right: `${(PAGE_W - right).toFixed(2)}mm` }
            : { left: `${(x ?? 0).toFixed(2)}mm` }),
        ...(width !== undefined ? { width: `${width}mm` } : {}),
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
  size = BODY,
  right,
  dotted = true,
}: {
  label?: string;
  labelX?: number;
  x0: number;
  x1: number;
  y: number;
  value: string;
  onChange: (v: string) => void;
  aria: string;
  size?: number;
  right?: number;
  dotted?: boolean;
}) {
  return (
    <>
      {label ? (
        <Lbl x={labelX ?? x0} y={y} size={size}>
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
          borderBottom: dotted ? "0.5pt dotted #111" : undefined,
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
            fontSize: `${size}pt`,
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

export function OfficialArrestWarrantDocument({
  fields,
  onChange,
}: {
  fields: ArrestWarrantFields;
  onChange: <K extends keyof ArrestWarrantFields>(key: K, value: ArrestWarrantFields[K]) => void;
}) {
  const toggle = (key: keyof ArrestWarrantFields) => () => onChange(key, !fields[key] as never);

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet>
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

        <Line labelX={103.2} label="ศาล" x0={111.0} x1={150.0} y={54.7} value={fields.courtName} onChange={(v) => onChange("courtName", v)} aria="ศาล" />

        <Line labelX={95.0} label="วันที่" x0={105.0} x1={120.0} y={62.7} value={fields.dateDay} onChange={(v) => onChange("dateDay", v)} aria="วันที่" />
        <Line labelX={120.0} label="เดือน" x0={128.0} x1={143.0} y={62.7} value={fields.dateMonth} onChange={(v) => onChange("dateMonth", v)} aria="เดือน" />
        <Line labelX={143.0} label="พุทธศักราช" x0={158.0} x1={193.38} y={62.7} value={fields.dateYear} onChange={(v) => onChange("dateYear", v)} aria="พุทธศักราช" />

        <Lbl x={25.5} y={70.4}>
          ความอาญา
        </Lbl>
        <Line x0={43.0} x1={90.0} y={70.4} value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} aria="ความอาญา" />

        <Lbl x={25.5} y={79.9}>
          ผู้ร้อง
        </Lbl>
        <Line x0={40.30} x1={193.38} y={79.9} value={fields.petitioner} onChange={(v) => onChange("petitioner", v)} aria="ผู้ร้อง" />

        <Lbl x={25.5} y={90.2}>
          หมายถึง
        </Lbl>
        <Line x0={40.30} x1={193.38} y={90.2} value={fields.address} onChange={(v) => onChange("address", v)} aria="หมายถึง" />

        <Lbl x={25.5} y={100.9}>
          ด้วย
        </Lbl>
        <Line x0={34.60} x1={193.38} y={100.9} value={fields.whereasText} onChange={(v) => onChange("whereasText", v)} aria="ด้วย" />

        <Lbl x={25.5} y={125.1} nowrap={false} width={165}>
          ซึ่งต้องหาว่ากระทำความผิดฐาน
        </Lbl>
        <Line x0={80.20} x1={193.38} y={125.1} value={fields.chargeText} onChange={(v) => onChange("chargeText", v)} aria="ข้อหา" />

        <Lbl x={25.5} y={147.4} nowrap={false} width={165}>
          กรณีมีหลักฐานตามสมควรว่า
        </Lbl>
        <Line x0={72.60} x1={193.38} y={147.4} value={fields.evidenceText} onChange={(v) => onChange("evidenceText", v)} aria="หลักฐาน" />

        <CheckBox x={25.5} y={155.2} checked={fields.ground1} onToggle={toggle("ground1")} label="ได้หรือน่าจะได้กระทำความผิดอาญาซึ่งมีอัตราโทษจำคุกอย่างสูงเกินสามปี" />
        <CheckBox x={25.5} y={170.7} checked={fields.ground2} onToggle={toggle("ground2")} label="ได้หรือน่าจะได้กระทำความผิดอาญาและมีเหตุอันควรเชื่อว่า" />
        <CheckBox x={38.0} y={179.4} checked={fields.ground2_1} onToggle={toggle("ground2_1")} label="จะหลบหนี" />
        <CheckBox x={38.0} y={187.2} checked={fields.ground2_2} onToggle={toggle("ground2_2")} label="จะไปยุ่งเหยิงกับพยานหลักฐาน" />
        <CheckBox x={38.0} y={194.9} checked={fields.ground2_3} onToggle={toggle("ground2_3")} label="ก่อเหตุอันตรายประการอื่น" />
        <CheckBox x={25.5} y={202.7} checked={fields.ground3} onToggle={toggle("ground3")} label="อื่น ๆ" />

        <Lbl x={25.5} y={209.5}>
          เพราะฉะนั้นให้ท่านจับตัว
        </Lbl>
        <Line x0={72.60} x1={193.38} y={209.5} value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} aria="ผู้ถูกจับ" />

        <Line labelX={25.7} label="เลขประจำตัวประชาชน" x0={62.0} x1={130.0} y={217.3} value={fields.idNumber} onChange={(v) => onChange("idNumber", v)} aria="เลขประจำตัวประชาชน" />
        <Line labelX={150.7} label="เชื้อชาติ" x0={161.0} x1={193.38} y={217.3} value={fields.ethnicity} onChange={(v) => onChange("ethnicity", v)} aria="เชื้อชาติ" />

        <Line labelX={25.7} label="สัญชาติ" x0={36.0} x1={52.0} y={225.0} value={fields.nationality} onChange={(v) => onChange("nationality", v)} aria="สัญชาติ" />
        <Line labelX={58.2} label="อาชีพ" x0={66.0} x1={92.0} y={225.0} value={fields.occupation} onChange={(v) => onChange("occupation", v)} aria="อาชีพ" />
        <Line labelX={98.2} label="อยู่บ้านเลขที่" x0={113.0} x1={193.38} y={225.0} value={fields.houseNo} onChange={(v) => onChange("houseNo", v)} aria="อยู่บ้านเลขที่" />
        <Line labelX={175.7} label="หมู่ที่" x0={183.0} x1={193.38} y={225.0} value={fields.moo} onChange={(v) => onChange("moo", v)} aria="หมู่ที่" />

        <Line labelX={25.7} label="ถนน" x0={33.0} x1={62.0} y={232.8} value={fields.road} onChange={(v) => onChange("road", v)} aria="ถนน" />
        <Line labelX={145.7} label="ตรอก/ซอย" x0={157.0} x1={193.38} y={232.8} value={fields.alley} onChange={(v) => onChange("alley", v)} aria="ตรอกซอย" />
        <Lbl x={175.7} y={232.8}>
          ใกล้
        </Lbl>
        <Line x0={184.80} x1={193.38} y={232.8} value={fields.near} onChange={(v) => onChange("near", v)} aria="ใกล้" />

        <Line labelX={25.7} label="ตำบล/แขวง" x0={40.0} x1={130.0} y={248.3} value={fields.subDistrict} onChange={(v) => onChange("subDistrict", v)} aria="ตำบลแขวง" />
        <Line labelX={145.7} label="อำเภอ/เขต" x0={157.0} x1={193.38} y={248.3} value={fields.district} onChange={(v) => onChange("district", v)} aria="อำเภอเขต" />
        <Lbl x={175.7} y={248.3}>
          จังหวัด
        </Lbl>
        <Line x0={190.50} x1={193.38} y={248.3} value={fields.province} onChange={(v) => onChange("province", v)} aria="จังหวัด" />

        <Line labelX={25.7} label="โทรศัพท์" x0={37.0} x1={62.0} y={263.8} value={fields.phone} onChange={(v) => onChange("phone", v)} aria="โทรศัพท์" />
        <Line labelX={145.7} label="ไปส่งที่" x0={157.0} x1={193.38} y={263.8} value={fields.sendTo} onChange={(v) => onChange("sendTo", v)} aria="ไปส่งที่" />

        <Lbl x={25.5} y={279.4}>
          ภายในอายุความ
        </Lbl>
        <Line x0={51.70} x1={54.0} y={279.4} value={fields.ageLimit} onChange={(v) => onChange("ageLimit", v)} aria="อายุความปี" />
        <Lbl x={56.0} y={279.4}>
          ปีนับตั้งแต่วันที่
        </Lbl>
        <Line x0={91.70} x1={92.0} y={279.4} value={fields.fromDay} onChange={(v) => onChange("fromDay", v)} aria="จากวันที่" />
        <Lbl x={93.0} y={279.4}>
          เดือน
        </Lbl>
        <Line x0={104.00} x1={114.0} y={279.4} value={fields.fromMonth} onChange={(v) => onChange("fromMonth", v)} aria="จากเดือน" />
        <Lbl x={115.0} y={279.4}>
          พ.ศ.
        </Lbl>
        <Line x0={124.0} x1={136.0} y={279.4} value={fields.fromYear} onChange={(v) => onChange("fromYear", v)} aria="จากปี" />
        <Lbl x={138.0} y={279.4}>
          เพื่อจะ
        </Lbl>
        <Line x0={152.80} x1={193.38} y={279.4} value={fields.purposeText} onChange={(v) => onChange("purposeText", v)} aria="เพื่อจะ" />
      </Sheet>
    </div>
  );
}
