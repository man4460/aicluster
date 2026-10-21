"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ORAL_PLEA_FORM_SUBTITLE,
  ORAL_PLEA_FORM_TITLE,
} from "@/lib/smart-police/form-templates/official-form-catalog";
import type { OralPleaFields } from "@/lib/smart-police/form-templates/oral-plea";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const TITLE = "15pt";
const LINE = "6.2mm";

function Dot({
  value,
  onChange,
  "aria-label": ariaLabel,
  minCh = 4,
  flex,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  minCh?: number;
  flex?: boolean;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field align-baseline", flex ? "min-w-0 flex-1" : "inline")}
      style={{
        minWidth: flex ? 0 : `${minCh}ch`,
        width: flex ? "100%" : `${Math.max(minCh, (value || "").length + 1)}ch`,
        fontSize: "inherit",
        lineHeight: "inherit",
        height: "auto",
        paddingBottom: "1px",
      }}
    />
  );
}

function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: "0 1.5mm",
        minHeight: LINE,
        margin: "0 0 0.55mm",
        lineHeight: LINE,
        fontSize: BODY,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function L({ children }: { children: ReactNode }) {
  return <span style={{ fontWeight: 700, flexShrink: 0 }}>{children}</span>;
}

function T({ children }: { children: ReactNode }) {
  return <span style={{ flexShrink: 0 }}>{children}</span>;
}

function LinedNotes({
  value,
  onChange,
  lines,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
}) {
  return (
    <div style={{ position: "relative", margin: "0 0 1.2mm" }}>
      <div aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            style={{ height: LINE, borderBottom: "0.5pt dotted #111", boxSizing: "border-box" }}
          />
        ))}
      </div>
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          fontFamily: "inherit",
          fontSize: BODY,
          lineHeight: LINE,
          color: "#111",
        }}
      />
    </div>
  );
}

function Sheet({ children, index }: { children: ReactNode; index: number }) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "12mm 14mm 12mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </article>
  );
}

export function OfficialOralPleaDocument({
  fields,
  onChange,
}: {
  fields: OralPleaFields;
  onChange: <K extends keyof OralPleaFields>(key: K, value: OralPleaFields[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <Sheet index={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "42mm 1fr 46mm",
            columnGap: "2mm",
            alignItems: "start",
            marginBottom: "2mm",
            flexShrink: 0,
          }}
        >
          <div style={{ paddingTop: "28mm", fontSize: SMALL }}>
            <Row style={{ flexWrap: "nowrap", fontSize: SMALL, minHeight: "5.5mm", lineHeight: "5.5mm" }}>
              <T>ยศ</T>
              <Dot aria-label="ยศ" value={fields.rank} onChange={(v) => onChange("rank", v)} flex minCh={4} />
            </Row>
          </div>
          <header style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/smart-police/garuda.png"
              alt=""
              width={84}
              height={96}
              style={{ display: "block", margin: "0 auto 1mm", height: "22mm", width: "auto" }}
            />
            <p style={{ margin: 0, fontSize: "20pt", fontWeight: 700, lineHeight: 1.15 }}>สำนักงานตำรวจแห่งชาติ</p>
            <h1
              style={{
                margin: "1mm 0 0",
                fontSize: TITLE,
                fontWeight: 700,
                lineHeight: 1.25,
                textDecoration: "underline",
                textUnderlineOffset: "1mm",
              }}
            >
              {ORAL_PLEA_FORM_TITLE}
            </h1>
            <p
              style={{
                margin: "0.6mm 0 0",
                fontSize: TITLE,
                fontWeight: 700,
                lineHeight: 1.25,
                textDecoration: "underline",
                textUnderlineOffset: "1mm",
              }}
            >
              {ORAL_PLEA_FORM_SUBTITLE}
            </p>
          </header>
          <div style={{ fontSize: SMALL, textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.35 }}>บัตรประจำตัวประชาชน</p>
            <Row style={{ flexWrap: "nowrap", fontSize: SMALL, minHeight: "5.5mm", lineHeight: "5.5mm" }}>
              <T>เลขที่</T>
              <Dot
                aria-label="เลขที่บัตรประชาชน"
                value={fields.idCardNo}
                onChange={(v) => onChange("idCardNo", v)}
                flex
                minCh={6}
              />
            </Row>
            <p style={{ margin: "8mm 0 0", fontWeight: 700 }}>บันทึก</p>
          </div>
        </div>

        <Row>
          <L>สถานีตำรวจ</L>
          <Dot
            aria-label="สถานีตำรวจ"
            value={fields.stationName}
            onChange={(v) => onChange("stationName", v)}
            flex
          />
          <L>เขต</L>
          <Dot aria-label="เขต" value={fields.district} onChange={(v) => onChange("district", v)} flex minCh={5} />
          <L>จังหวัด</L>
          <Dot
            aria-label="จังหวัด"
            value={fields.province}
            onChange={(v) => onChange("province", v)}
            flex
            minCh={6}
          />
        </Row>
        <Row>
          <L>วันที่</L>
          <Dot aria-label="วันที่" value={fields.dayThai} onChange={(v) => onChange("dayThai", v)} minCh={3} />
          <L>เดือน</L>
          <Dot
            aria-label="เดือน"
            value={fields.monthThai}
            onChange={(v) => onChange("monthThai", v)}
            flex
            minCh={6}
          />
          <L>พุทธศักราช ๒๕</L>
          <Dot aria-label="พ.ศ." value={fields.yearThai} onChange={(v) => onChange("yearThai", v)} minCh={3} />
        </Row>
        <Row>
          <L>สอบสวนที่</L>
          <Dot
            aria-label="สอบสวนที่"
            value={fields.interviewPlace}
            onChange={(v) => onChange("interviewPlace", v)}
            flex
          />
        </Row>
        <Row>
          <L>ชื่อ-สกุล</L>
          <Dot aria-label="ชื่อ-สกุล" value={fields.fullName} onChange={(v) => onChange("fullName", v)} flex />
          <L>อายุ</L>
          <Dot aria-label="อายุ" value={fields.age} onChange={(v) => onChange("age", v)} minCh={3} />
          <L>ปี</L>
        </Row>
        <Row>
          <L>เชื้อชาติ</L>
          <Dot
            aria-label="เชื้อชาติ"
            value={fields.ethnicity}
            onChange={(v) => onChange("ethnicity", v)}
            flex
            minCh={4}
          />
          <L>สัญชาติ</L>
          <Dot
            aria-label="สัญชาติ"
            value={fields.nationality}
            onChange={(v) => onChange("nationality", v)}
            flex
            minCh={4}
          />
          <L>ศาสนา</L>
          <Dot
            aria-label="ศาสนา"
            value={fields.religion}
            onChange={(v) => onChange("religion", v)}
            flex
            minCh={4}
          />
          <L>อาชีพ</L>
          <Dot
            aria-label="อาชีพ"
            value={fields.occupation}
            onChange={(v) => onChange("occupation", v)}
            flex
            minCh={5}
          />
        </Row>
        <Row>
          <L>อยู่บ้านเลขที่</L>
          <Dot
            aria-label="บ้านเลขที่"
            value={fields.houseNo}
            onChange={(v) => onChange("houseNo", v)}
            flex
            minCh={4}
          />
          <L>หมู่ที่</L>
          <Dot aria-label="หมู่ที่" value={fields.moo} onChange={(v) => onChange("moo", v)} minCh={3} />
          <L>ถนน</L>
          <Dot aria-label="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} flex minCh={5} />
        </Row>
        <Row>
          <L>ตำบล</L>
          <Dot aria-label="ตำบล" value={fields.tambon} onChange={(v) => onChange("tambon", v)} flex minCh={5} />
          <L>อำเภอ</L>
          <Dot aria-label="อำเภอ" value={fields.amphoe} onChange={(v) => onChange("amphoe", v)} flex minCh={5} />
          <L>จังหวัด</L>
          <Dot
            aria-label="จังหวัดที่อยู่"
            value={fields.addressProvince}
            onChange={(v) => onChange("addressProvince", v)}
            flex
            minCh={5}
          />
        </Row>
        <Row>
          <L>ชื่อบิดา-มารดา</L>
          <Dot
            aria-label="ชื่อบิดา-มารดา"
            value={fields.parentsName}
            onChange={(v) => onChange("parentsName", v)}
            flex
          />
        </Row>
        <Row>
          <L>เกิดที่ตำบล</L>
          <Dot
            aria-label="เกิดที่ตำบล"
            value={fields.birthTambon}
            onChange={(v) => onChange("birthTambon", v)}
            flex
            minCh={5}
          />
          <L>อำเภอ</L>
          <Dot
            aria-label="เกิดอำเภอ"
            value={fields.birthAmphoe}
            onChange={(v) => onChange("birthAmphoe", v)}
            flex
            minCh={5}
          />
          <L>จังหวัด</L>
          <Dot
            aria-label="เกิดจังหวัด"
            value={fields.birthProvince}
            onChange={(v) => onChange("birthProvince", v)}
            flex
            minCh={5}
          />
        </Row>

        <p style={{ margin: "1.5mm 0 0.8mm", fontSize: BODY, lineHeight: 1.5, textAlign: "justify" }}>
          พนักงานสอบสวนได้แจ้งข้อกล่าวหาให้ข้าพเจ้าทราบ และได้แจ้งให้ทราบด้วยว่าคำให้การนี้อาจนำไปเป็นพยานหลักฐานในชั้นพิจารณาของศาลได้
        </p>
        <p style={{ margin: "0 0 2mm", fontSize: BODY, lineHeight: 1.5 }}>
          ข้าพเจ้าทราบข้อกล่าวหาตลอดแล้ว ขอให้การด้วยความเต็มใจ ดังต่อไปนี้
        </p>
        <p style={{ margin: "0 0 1mm", fontSize: BODY, lineHeight: 1.5 }}>
          พนักงานสอบสวนได้แจ้งข้อเท็จจริงและข้อกล่าวหาให้ทราบว่า
        </p>
        <Row>
          <T>เหตุเกิด เมื่อวันที่</T>
          <Dot
            aria-label="วันที่เกิดเหตุ"
            value={fields.incidentDay}
            onChange={(v) => onChange("incidentDay", v)}
            flex
            minCh={6}
          />
          <T>เวลาประมาณ</T>
          <Dot
            aria-label="เวลาเกิดเหตุ"
            value={fields.incidentTime}
            onChange={(v) => onChange("incidentTime", v)}
            flex
            minCh={5}
          />
          <T>น.</T>
        </Row>
        <Row>
          <T>พฤติการณ์และการกระทำของผู้ต้องหาเป็นความผิดฐาน “</T>
          <Dot
            aria-label="ความผิดฐาน"
            value={fields.charge}
            onChange={(v) => onChange("charge", v)}
            flex
            minCh={8}
          />
          <T>”</T>
        </Row>
        <p style={{ margin: "0 0 2mm", fontSize: BODY, lineHeight: 1.5, textAlign: "justify" }}>
          และได้แจ้งสิทธิของผู้ต้องหาให้ทราบว่า ผู้ต้องหามีสิทธิที่จะให้การหรือไม่ก็ได้ ถ้าผู้ต้องหาให้การถ้อยคำที่ผู้ต้องหาให้การนั้นอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้ และผู้ต้องหามีสิทธิให้ทนายความหรือผู้ซึ่งตนไว้วางใจเข้าฟังการสอบปากคำตนได้
        </p>
        <p style={{ margin: "0 0 0.6mm", fontSize: BODY, lineHeight: 1.45, textAlign: "justify" }}>
          <b>ถาม</b> ผู้ต้องหามีทนายความหรือไม่ ต้องการให้ผู้ใดร่วมฟังการสอบสวนหรือไม่ และตามที่ได้แจ้งข้อกล่าวหาให้ทราบแล้วนั้น
          เข้าใจดีแล้วหรือไม่ จะให้อย่างไร เคยต้องโทษคดีอาญาใด ๆ มาก่อนหรือไม่
        </p>
        <Row style={{ alignItems: "flex-start" }}>
          <L>ตอบ</L>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LinedNotes
              value={fields.answerLawyer}
              onChange={(v) => onChange("answerLawyer", v)}
              lines={4}
              ariaLabel="คำตอบเรื่องทนายความและรับสารภาพ"
            />
          </div>
        </Row>
      </Sheet>

      <Sheet index={1}>
        <p style={{ margin: "0 0 4mm", textAlign: "center", fontSize: BODY }}>(๒)</p>
        <p style={{ margin: "0 0 0.6mm", fontSize: BODY, lineHeight: 1.45, textAlign: "justify" }}>
          <b>ถาม</b> ขอทราบประวัติผู้ต้องหาพอสังเขป และผู้ต้องหาเคยต้องหาหรือต้องโทษคดีอาญาใด ๆ มาก่อนหรือไม่
        </p>
        <p style={{ margin: "0 0 0.8mm", fontSize: BODY, lineHeight: LINE }}>
          <b>ตอบ</b> ข้าฯ มีภูมิลำเนาตามที่อยู่ดังกล่าวข้างต้นและปัจจุบันพักอาศัยอยู่ที่
        </p>
        <Row>
          <Dot
            aria-label="ที่พักปัจจุบัน"
            value={fields.currentStay}
            onChange={(v) => onChange("currentStay", v)}
            flex
          />
        </Row>
        <Row>
          <T>หากข้าฯ ย้ายที่อยู่เมื่อใด จะแจ้งให้พนักงานสอบสวนทราบทันที ข้าฯ จบการศึกษาชั้น</T>
          <Dot
            aria-label="การศึกษา"
            value={fields.education}
            onChange={(v) => onChange("education", v)}
            flex
            minCh={6}
          />
        </Row>
        <Row>
          <T>ประกอบอาชีพ</T>
          <Dot aria-label="ประกอบอาชีพ" value={fields.job} onChange={(v) => onChange("job", v)} flex minCh={5} />
          <T>อยู่ที่</T>
          <Dot
            aria-label="สถานที่ทำงาน"
            value={fields.workplace}
            onChange={(v) => onChange("workplace", v)}
            flex
            minCh={5}
          />
          <T>มีรายได้ประมาณเดือนละ</T>
          <Dot aria-label="รายได้" value={fields.income} onChange={(v) => onChange("income", v)} flex minCh={4} />
          <T>บาท</T>
          <T>สถานภาพ</T>
          <Dot
            aria-label="สถานภาพ"
            value={fields.maritalStatus}
            onChange={(v) => onChange("maritalStatus", v)}
            flex
            minCh={4}
          />
        </Row>
        <p style={{ margin: "0 0 2mm", fontSize: BODY, lineHeight: 1.5 }}>
          ไม่เคยต้องหาหรือต้องโทษอาญาใด ๆ มาก่อน
        </p>
        <p style={{ margin: "0 0 0.6mm", fontSize: BODY, lineHeight: 1.45 }}>
          <b>ถาม</b> เหตุในคดีนี้เกิดที่ไหน เมื่อใด
        </p>
        <Row>
          <L>ตอบ</L>
          <T>เหตุเกิด</T>
          <Dot
            aria-label="สถานที่เกิดเหตุ"
            value={fields.incidentPlace}
            onChange={(v) => onChange("incidentPlace", v)}
            flex
          />
          <T>เมื่อ</T>
          <Dot
            aria-label="เมื่อเกิดเหตุ"
            value={fields.incidentWhen}
            onChange={(v) => onChange("incidentWhen", v)}
            flex
            minCh={6}
          />
          <T>เวลาประมาณ</T>
          <Dot
            aria-label="เวลาประมาณเกิดเหตุหน้า 2"
            value={fields.incidentClock}
            onChange={(v) => onChange("incidentClock", v)}
            flex
            minCh={4}
          />
          <T>น.</T>
        </Row>
        <p style={{ margin: "2mm 0 0.6mm", fontSize: BODY, lineHeight: 1.45 }}>
          <b>ถาม</b> ผู้ต้องหาเคยมีสาเหตุโกรธเคืองกับผู้หนึ่งผู้ใดมาก่อนหรือไม่
        </p>
        <Row style={{ alignItems: "flex-start" }}>
          <L>ตอบ</L>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LinedNotes
              value={fields.answerGrudge}
              onChange={(v) => onChange("answerGrudge", v)}
              lines={2}
              ariaLabel="คำตอบเรื่องสาเหตุโกรธเคือง"
            />
          </div>
        </Row>

        <p style={{ margin: "10mm 0 8mm", textAlign: "center", fontSize: BODY }}>
          อ่านให้ฟังแล้วรับว่าเป็นความจริงถูกต้อง
        </p>
        <div style={{ width: "72%", marginLeft: "auto" }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>ลงชื่อ</T>
            <Dot
              aria-label="ลงชื่อผู้กล่าวหา"
              value={fields.signComplainant}
              onChange={(v) => onChange("signComplainant", v)}
              flex
            />
            <T>ผู้กล่าวหา</T>
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>ลงชื่อ</T>
            <Dot
              aria-label="ลงชื่อสอบสวน"
              value={fields.signOfficer}
              onChange={(v) => onChange("signOfficer", v)}
              flex
            />
            <T>สอบสวน/พิมพ์/อ่าน</T>
          </Row>
        </div>
      </Sheet>
    </div>
  );
}
